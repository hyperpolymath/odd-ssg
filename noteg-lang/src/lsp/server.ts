// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * NoteG Language Server Protocol (LSP) Implementation
 * Provides IDE support for .noteg files
 */

import { Lexer, TokenType, type Token } from "../lexer.ts";
import { Parser, type ProgramNode, type ParseError } from "../parser.ts";

// LSP Message Types
interface LSPMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

interface Position {
  line: number;
  character: number;
}

interface Range {
  start: Position;
  end: Position;
}

interface Diagnostic {
  range: Range;
  severity: 1 | 2 | 3 | 4; // Error, Warning, Info, Hint
  message: string;
  source: string;
}

interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

// Document store
const documents = new Map<string, { text: string; version: number; ast?: ProgramNode }>();

// LSP Server implementation
class NotegLanguageServer {
  private initialized = false;

  async handleMessage(message: LSPMessage): Promise<LSPMessage | null> {
    if (message.method) {
      return this.handleRequest(message);
    }
    return null;
  }

  private async handleRequest(message: LSPMessage): Promise<LSPMessage | null> {
    const method = message.method!;
    const params = message.params as Record<string, unknown>;

    switch (method) {
      case "initialize":
        return this.handleInitialize(message.id!);

      case "initialized":
        this.initialized = true;
        return null;

      case "shutdown":
        return { jsonrpc: "2.0", id: message.id, result: null };

      case "textDocument/didOpen":
        this.handleDidOpen(params.textDocument as TextDocumentItem);
        return null;

      case "textDocument/didChange":
        this.handleDidChange(params);
        return null;

      case "textDocument/didClose":
        this.handleDidClose(params);
        return null;

      case "textDocument/completion":
        return {
          jsonrpc: "2.0",
          id: message.id,
          result: this.handleCompletion(params)
        };

      case "textDocument/hover":
        return {
          jsonrpc: "2.0",
          id: message.id,
          result: this.handleHover(params)
        };

      case "textDocument/definition":
        return {
          jsonrpc: "2.0",
          id: message.id,
          result: this.handleDefinition(params)
        };

      default:
        return null;
    }
  }

  private handleInitialize(id: number | string): LSPMessage {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        capabilities: {
          textDocumentSync: 1, // Full sync
          completionProvider: {
            triggerCharacters: [".", "{", "|"],
            resolveProvider: false
          },
          hoverProvider: true,
          definitionProvider: true,
          documentFormattingProvider: true,
          diagnosticProvider: {
            interFileDependencies: false,
            workspaceDiagnostics: false
          }
        },
        serverInfo: {
          name: "noteg-lsp",
          version: "0.1.0"
        }
      }
    };
  }

  private handleDidOpen(doc: TextDocumentItem): void {
    documents.set(doc.uri, {
      text: doc.text,
      version: doc.version
    });
    this.validateDocument(doc.uri);
  }

  private handleDidChange(params: Record<string, unknown>): void {
    const textDocument = params.textDocument as { uri: string; version: number };
    const contentChanges = params.contentChanges as { text: string }[];

    if (contentChanges.length > 0) {
      documents.set(textDocument.uri, {
        text: contentChanges[0].text,
        version: textDocument.version
      });
      this.validateDocument(textDocument.uri);
    }
  }

  private handleDidClose(params: Record<string, unknown>): void {
    const textDocument = params.textDocument as { uri: string };
    documents.delete(textDocument.uri);
  }

  private handleCompletion(params: Record<string, unknown>): CompletionItem[] {
    const keywords: CompletionItem[] = [
      { label: "let", kind: 14, detail: "Variable declaration", insertText: "let ${1:name} = ${2:value}" },
      { label: "const", kind: 14, detail: "Constant declaration", insertText: "const ${1:name} = ${2:value}" },
      { label: "fn", kind: 3, detail: "Function declaration", insertText: "fn ${1:name}(${2:params}) {\n\t${3}\n}" },
      { label: "if", kind: 14, detail: "Conditional", insertText: "if (${1:condition}) {\n\t${2}\n}" },
      { label: "for", kind: 14, detail: "Loop", insertText: "for ${1:item} in ${2:items} {\n\t${3}\n}" },
      { label: "return", kind: 14, detail: "Return statement", insertText: "return ${1:value}" },
      { label: "import", kind: 14, detail: "Import module", insertText: "import { ${1:name} } from \"${2:module}\"" },
      { label: "export", kind: 14, detail: "Export declaration" },
      { label: "template", kind: 14, detail: "Template block" },
      { label: "true", kind: 21, detail: "Boolean true" },
      { label: "false", kind: 21, detail: "Boolean false" },
      { label: "null", kind: 21, detail: "Null value" }
    ];

    // Add built-in functions
    const builtins: CompletionItem[] = [
      { label: "print", kind: 3, detail: "Print to console", insertText: "print(${1:value})" },
      { label: "len", kind: 3, detail: "Get length", insertText: "len(${1:value})" },
      { label: "map", kind: 3, detail: "Transform array", insertText: "map(${1:fn})" },
      { label: "filter", kind: 3, detail: "Filter array", insertText: "filter(${1:fn})" },
      { label: "reduce", kind: 3, detail: "Reduce array", insertText: "reduce(${1:fn}, ${2:initial})" }
    ];

    return [...keywords, ...builtins];
  }

  private handleHover(params: Record<string, unknown>): { contents: string } | null {
    const textDocument = params.textDocument as { uri: string };
    const position = params.position as Position;
    const doc = documents.get(textDocument.uri);

    if (!doc) return null;

    // Find token at position
    const lexer = new Lexer(doc.text);
    const { tokens } = lexer.tokenize();

    for (const token of tokens) {
      if (token.line === position.line + 1 &&
          token.column <= position.character + 1 &&
          token.column + token.length > position.character + 1) {

        // Return hover info based on token type
        if (token.type === TokenType.KEYWORD) {
          return { contents: this.getKeywordDoc(token.value) };
        }
        if (token.type === TokenType.IDENTIFIER) {
          return { contents: `**${token.value}**\n\nIdentifier` };
        }
      }
    }

    return null;
  }

  private handleDefinition(params: Record<string, unknown>): Range | null {
    // Simplified: would need symbol table for real implementation
    return null;
  }

  private validateDocument(uri: string): Diagnostic[] {
    const doc = documents.get(uri);
    if (!doc) return [];

    const diagnostics: Diagnostic[] = [];

    // Lex
    const lexer = new Lexer(doc.text);
    const { tokens, errors: lexErrors } = lexer.tokenize();

    for (const error of lexErrors) {
      diagnostics.push({
        range: {
          start: { line: error.line - 1, character: error.column - 1 },
          end: { line: error.line - 1, character: error.column }
        },
        severity: 1,
        message: error.message,
        source: "noteg"
      });
    }

    // Parse
    const parser = new Parser(tokens);
    const { ast, errors: parseErrors } = parser.parse();

    for (const error of parseErrors) {
      diagnostics.push({
        range: {
          start: { line: error.token.line - 1, character: error.token.column - 1 },
          end: { line: error.token.line - 1, character: error.token.column + error.token.length }
        },
        severity: 1,
        message: error.message,
        source: "noteg"
      });
    }

    // Store AST for other features
    doc.ast = ast;

    return diagnostics;
  }

  private getKeywordDoc(keyword: string): string {
    const docs: Record<string, string> = {
      "let": "**let**\n\nDeclare a mutable variable.\n\n```noteg\nlet x = 42\n```",
      "const": "**const**\n\nDeclare an immutable constant.\n\n```noteg\nconst PI = 3.14159\n```",
      "fn": "**fn**\n\nDeclare a function.\n\n```noteg\nfn add(a, b) {\n  return a + b\n}\n```",
      "if": "**if**\n\nConditional statement.\n\n```noteg\nif (condition) {\n  // then\n} else {\n  // else\n}\n```",
      "for": "**for**\n\nLoop over iterable.\n\n```noteg\nfor item in items {\n  print(item)\n}\n```",
      "return": "**return**\n\nReturn value from function.",
      "import": "**import**\n\nImport from module.\n\n```noteg\nimport { foo } from \"module\"\n```",
      "export": "**export**\n\nExport declaration.",
      "template": "**template**\n\nDefine a template block with {{ variable }} interpolation."
    };

    return docs[keyword] ?? `**${keyword}**`;
  }
}

// Main server loop
async function main() {
  const server = new NotegLanguageServer();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  console.error("NoteG Language Server started");

  // Read from stdin
  const buffer = new Uint8Array(65536);
  let contentLength = 0;
  let headerComplete = false;
  let messageBuffer = "";

  while (true) {
    const n = await Deno.stdin.read(buffer);
    if (n === null) break;

    const chunk = decoder.decode(buffer.subarray(0, n));
    messageBuffer += chunk;

    // Parse headers
    while (true) {
      if (!headerComplete) {
        const headerEnd = messageBuffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) break;

        const headers = messageBuffer.substring(0, headerEnd);
        const match = headers.match(/Content-Length:\s*(\d+)/i);
        if (match) {
          contentLength = parseInt(match[1]);
        }
        messageBuffer = messageBuffer.substring(headerEnd + 4);
        headerComplete = true;
      }

      if (headerComplete && messageBuffer.length >= contentLength) {
        const content = messageBuffer.substring(0, contentLength);
        messageBuffer = messageBuffer.substring(contentLength);
        headerComplete = false;

        try {
          const message = JSON.parse(content) as LSPMessage;
          const response = await server.handleMessage(message);

          if (response) {
            const responseStr = JSON.stringify(response);
            const responseBytes = encoder.encode(responseStr);
            const header = `Content-Length: ${responseBytes.length}\r\n\r\n`;
            await Deno.stdout.write(encoder.encode(header));
            await Deno.stdout.write(responseBytes);
          }
        } catch (e) {
          console.error("Error processing message:", e);
        }
      } else {
        break;
      }
    }
  }
}

if (import.meta.main) {
  main();
}

export { NotegLanguageServer };

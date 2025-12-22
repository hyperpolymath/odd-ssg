// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * NoteG Language Lexer
 * Tokenizes NoteG source files for parsing
 */

export enum TokenType {
  // Literals
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  NULL = "NULL",

  // Identifiers
  IDENTIFIER = "IDENTIFIER",
  KEYWORD = "KEYWORD",

  // Operators
  ASSIGN = "ASSIGN",
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  PLUS = "PLUS",
  MINUS = "MINUS",
  MULTIPLY = "MULTIPLY",
  DIVIDE = "DIVIDE",
  MODULO = "MODULO",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  PIPE = "PIPE",
  ARROW = "ARROW",

  // Delimiters
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  COMMA = "COMMA",
  DOT = "DOT",
  COLON = "COLON",
  SEMICOLON = "SEMICOLON",

  // Template
  TEMPLATE_START = "TEMPLATE_START",
  TEMPLATE_END = "TEMPLATE_END",
  TEMPLATE_TEXT = "TEMPLATE_TEXT",

  // Special
  COMMENT = "COMMENT",
  NEWLINE = "NEWLINE",
  EOF = "EOF",
  ERROR = "ERROR"
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  length: number;
}

export interface LexerError {
  message: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  "let", "const", "fn", "if", "else", "for", "while", "return",
  "import", "export", "from", "as", "template", "content", "site",
  "true", "false", "null", "and", "or", "not"
]);

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];
  private inTemplate: boolean = false;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): { tokens: Token[]; errors: LexerError[] } {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.addToken(TokenType.EOF, "");
    return { tokens: this.tokens, errors: this.errors };
  }

  private scanToken(): void {
    const char = this.advance();

    switch (char) {
      // Single character tokens
      case "(": this.addToken(TokenType.LPAREN, char); break;
      case ")": this.addToken(TokenType.RPAREN, char); break;
      case "{":
        if (this.peek() === "{") {
          this.advance();
          this.addToken(TokenType.TEMPLATE_START, "{{");
          this.inTemplate = true;
        } else {
          this.addToken(TokenType.LBRACE, char);
        }
        break;
      case "}":
        if (this.peek() === "}" && this.inTemplate) {
          this.advance();
          this.addToken(TokenType.TEMPLATE_END, "}}");
          this.inTemplate = false;
        } else {
          this.addToken(TokenType.RBRACE, char);
        }
        break;
      case "[": this.addToken(TokenType.LBRACKET, char); break;
      case "]": this.addToken(TokenType.RBRACKET, char); break;
      case ",": this.addToken(TokenType.COMMA, char); break;
      case ".": this.addToken(TokenType.DOT, char); break;
      case ":": this.addToken(TokenType.COLON, char); break;
      case ";": this.addToken(TokenType.SEMICOLON, char); break;
      case "+": this.addToken(TokenType.PLUS, char); break;
      case "*": this.addToken(TokenType.MULTIPLY, char); break;
      case "%": this.addToken(TokenType.MODULO, char); break;
      case "|":
        if (this.peek() === ">") {
          this.advance();
          this.addToken(TokenType.PIPE, "|>");
        } else if (this.peek() === "|") {
          this.advance();
          this.addToken(TokenType.OR, "||");
        } else {
          this.addToken(TokenType.PIPE, char);
        }
        break;

      // Two character tokens
      case "-":
        if (this.peek() === ">") {
          this.advance();
          this.addToken(TokenType.ARROW, "->");
        } else {
          this.addToken(TokenType.MINUS, char);
        }
        break;
      case "=":
        if (this.peek() === "=") {
          this.advance();
          this.addToken(TokenType.EQUALS, "==");
        } else {
          this.addToken(TokenType.ASSIGN, char);
        }
        break;
      case "!":
        if (this.peek() === "=") {
          this.advance();
          this.addToken(TokenType.NOT_EQUALS, "!=");
        } else {
          this.addToken(TokenType.NOT, char);
        }
        break;
      case "&":
        if (this.peek() === "&") {
          this.advance();
          this.addToken(TokenType.AND, "&&");
        }
        break;

      // Division or comment
      case "/":
        if (this.peek() === "/") {
          this.lineComment();
        } else if (this.peek() === "*") {
          this.blockComment();
        } else {
          this.addToken(TokenType.DIVIDE, char);
        }
        break;

      // Whitespace
      case " ":
      case "\t":
      case "\r":
        break;
      case "\n":
        this.addToken(TokenType.NEWLINE, char);
        this.line++;
        this.column = 1;
        break;

      // String literals
      case '"':
      case "'":
        this.string(char);
        break;

      default:
        if (this.isDigit(char)) {
          this.number(char);
        } else if (this.isAlpha(char)) {
          this.identifier(char);
        } else {
          this.errors.push({
            message: `Unexpected character: ${char}`,
            line: this.line,
            column: this.column - 1
          });
        }
    }
  }

  private string(quote: string): void {
    const start = this.pos - 1;
    let value = "";

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 1;
      }
      if (this.peek() === "\\") {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "r": value += "\r"; break;
          case "\\": value += "\\"; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.errors.push({
        message: "Unterminated string",
        line: this.line,
        column: this.column
      });
      return;
    }

    this.advance(); // closing quote
    this.addToken(TokenType.STRING, value);
  }

  private number(first: string): void {
    let value = first;

    while (this.isDigit(this.peek())) {
      value += this.advance();
    }

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      value += this.advance(); // decimal point
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(first: string): void {
    let value = first;

    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    if (value === "true" || value === "false") {
      this.addToken(TokenType.BOOLEAN, value);
    } else if (value === "null") {
      this.addToken(TokenType.NULL, value);
    } else if (KEYWORDS.has(value)) {
      this.addToken(TokenType.KEYWORD, value);
    } else {
      this.addToken(TokenType.IDENTIFIER, value);
    }
  }

  private lineComment(): void {
    let value = "//";
    this.advance(); // second /

    while (!this.isAtEnd() && this.peek() !== "\n") {
      value += this.advance();
    }

    this.addToken(TokenType.COMMENT, value);
  }

  private blockComment(): void {
    let value = "/*";
    this.advance(); // *

    while (!this.isAtEnd()) {
      if (this.peek() === "*" && this.peekNext() === "/") {
        value += this.advance() + this.advance();
        break;
      }
      if (this.peek() === "\n") {
        this.line++;
        this.column = 1;
      }
      value += this.advance();
    }

    this.addToken(TokenType.COMMENT, value);
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
      length: value.length
    });
  }

  private advance(): string {
    this.column++;
    return this.source[this.pos++];
  }

  private peek(): string {
    return this.isAtEnd() ? "\0" : this.source[this.pos];
  }

  private peekNext(): string {
    return this.pos + 1 >= this.source.length ? "\0" : this.source[this.pos + 1];
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAlpha(char: string): boolean {
    return (char >= "a" && char <= "z") ||
           (char >= "A" && char <= "Z") ||
           char === "_";
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

export default Lexer;

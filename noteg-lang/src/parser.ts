// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * NoteG Language Parser
 * Builds AST from token stream
 */

import { Token, TokenType } from "./lexer.ts";

// AST Node Types
export type ASTNode =
  | ProgramNode
  | StatementNode
  | ExpressionNode;

export interface ProgramNode {
  type: "Program";
  body: StatementNode[];
}

export type StatementNode =
  | VariableDeclaration
  | FunctionDeclaration
  | ExpressionStatement
  | ReturnStatement
  | IfStatement
  | ForStatement
  | ImportStatement
  | ExportStatement
  | TemplateStatement;

export interface VariableDeclaration {
  type: "VariableDeclaration";
  kind: "let" | "const";
  name: string;
  init: ExpressionNode | null;
}

export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  name: string;
  params: string[];
  body: StatementNode[];
}

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: ExpressionNode;
}

export interface ReturnStatement {
  type: "ReturnStatement";
  argument: ExpressionNode | null;
}

export interface IfStatement {
  type: "IfStatement";
  test: ExpressionNode;
  consequent: StatementNode[];
  alternate: StatementNode[] | null;
}

export interface ForStatement {
  type: "ForStatement";
  variable: string;
  iterable: ExpressionNode;
  body: StatementNode[];
}

export interface ImportStatement {
  type: "ImportStatement";
  specifiers: string[];
  source: string;
}

export interface ExportStatement {
  type: "ExportStatement";
  declaration: StatementNode;
}

export interface TemplateStatement {
  type: "TemplateStatement";
  parts: (string | ExpressionNode)[];
}

// Expression types
export type ExpressionNode =
  | Identifier
  | Literal
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | MemberExpression
  | ArrayExpression
  | ObjectExpression
  | PipeExpression
  | TemplateExpression;

export interface Identifier {
  type: "Identifier";
  name: string;
}

export interface Literal {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
}

export interface BinaryExpression {
  type: "BinaryExpression";
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryExpression {
  type: "UnaryExpression";
  operator: string;
  argument: ExpressionNode;
}

export interface CallExpression {
  type: "CallExpression";
  callee: ExpressionNode;
  arguments: ExpressionNode[];
}

export interface MemberExpression {
  type: "MemberExpression";
  object: ExpressionNode;
  property: ExpressionNode;
  computed: boolean;
}

export interface ArrayExpression {
  type: "ArrayExpression";
  elements: ExpressionNode[];
}

export interface ObjectExpression {
  type: "ObjectExpression";
  properties: { key: string; value: ExpressionNode }[];
}

export interface PipeExpression {
  type: "PipeExpression";
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface TemplateExpression {
  type: "TemplateExpression";
  expression: ExpressionNode;
}

export interface ParseError {
  message: string;
  token: Token;
}

export class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    // Filter out comments and newlines for simpler parsing
    this.tokens = tokens.filter(t =>
      t.type !== TokenType.COMMENT &&
      t.type !== TokenType.NEWLINE
    );
  }

  parse(): { ast: ProgramNode; errors: ParseError[] } {
    const body: StatementNode[] = [];

    while (!this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (e) {
        this.synchronize();
      }
    }

    return {
      ast: { type: "Program", body },
      errors: this.errors
    };
  }

  private parseStatement(): StatementNode | null {
    const token = this.peek();

    if (token.type === TokenType.KEYWORD) {
      switch (token.value) {
        case "let":
        case "const":
          return this.parseVariableDeclaration();
        case "fn":
          return this.parseFunctionDeclaration();
        case "return":
          return this.parseReturnStatement();
        case "if":
          return this.parseIfStatement();
        case "for":
          return this.parseForStatement();
        case "import":
          return this.parseImportStatement();
        case "export":
          return this.parseExportStatement();
        case "template":
          return this.parseTemplateStatement();
      }
    }

    return this.parseExpressionStatement();
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const kind = this.advance().value as "let" | "const";
    const name = this.expect(TokenType.IDENTIFIER, "Expected variable name").value;

    let init: ExpressionNode | null = null;
    if (this.match(TokenType.ASSIGN)) {
      init = this.parseExpression();
    }

    this.match(TokenType.SEMICOLON);

    return { type: "VariableDeclaration", kind, name, init };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    this.advance(); // fn
    const name = this.expect(TokenType.IDENTIFIER, "Expected function name").value;

    this.expect(TokenType.LPAREN, "Expected '(' after function name");
    const params: string[] = [];

    if (!this.check(TokenType.RPAREN)) {
      do {
        params.push(this.expect(TokenType.IDENTIFIER, "Expected parameter name").value);
      } while (this.match(TokenType.COMMA));
    }

    this.expect(TokenType.RPAREN, "Expected ')' after parameters");
    this.expect(TokenType.LBRACE, "Expected '{' before function body");

    const body: StatementNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    this.expect(TokenType.RBRACE, "Expected '}' after function body");

    return { type: "FunctionDeclaration", name, params, body };
  }

  private parseReturnStatement(): ReturnStatement {
    this.advance(); // return

    let argument: ExpressionNode | null = null;
    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE)) {
      argument = this.parseExpression();
    }

    this.match(TokenType.SEMICOLON);

    return { type: "ReturnStatement", argument };
  }

  private parseIfStatement(): IfStatement {
    this.advance(); // if
    this.expect(TokenType.LPAREN, "Expected '(' after 'if'");
    const test = this.parseExpression();
    this.expect(TokenType.RPAREN, "Expected ')' after condition");
    this.expect(TokenType.LBRACE, "Expected '{' before if body");

    const consequent: StatementNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) consequent.push(stmt);
    }
    this.expect(TokenType.RBRACE, "Expected '}' after if body");

    let alternate: StatementNode[] | null = null;
    if (this.check(TokenType.KEYWORD) && this.peek().value === "else") {
      this.advance();
      this.expect(TokenType.LBRACE, "Expected '{' before else body");
      alternate = [];
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const stmt = this.parseStatement();
        if (stmt) alternate.push(stmt);
      }
      this.expect(TokenType.RBRACE, "Expected '}' after else body");
    }

    return { type: "IfStatement", test, consequent, alternate };
  }

  private parseForStatement(): ForStatement {
    this.advance(); // for
    const variable = this.expect(TokenType.IDENTIFIER, "Expected loop variable").value;
    this.expect(TokenType.KEYWORD, "Expected 'in'");
    const iterable = this.parseExpression();
    this.expect(TokenType.LBRACE, "Expected '{' before for body");

    const body: StatementNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    this.expect(TokenType.RBRACE, "Expected '}' after for body");

    return { type: "ForStatement", variable, iterable, body };
  }

  private parseImportStatement(): ImportStatement {
    this.advance(); // import
    this.expect(TokenType.LBRACE, "Expected '{' after import");

    const specifiers: string[] = [];
    if (!this.check(TokenType.RBRACE)) {
      do {
        specifiers.push(this.expect(TokenType.IDENTIFIER, "Expected import name").value);
      } while (this.match(TokenType.COMMA));
    }

    this.expect(TokenType.RBRACE, "Expected '}' after imports");
    this.expect(TokenType.KEYWORD, "Expected 'from'");
    const source = this.expect(TokenType.STRING, "Expected module path").value;
    this.match(TokenType.SEMICOLON);

    return { type: "ImportStatement", specifiers, source };
  }

  private parseExportStatement(): ExportStatement {
    this.advance(); // export
    const declaration = this.parseStatement()!;
    return { type: "ExportStatement", declaration };
  }

  private parseTemplateStatement(): TemplateStatement {
    this.advance(); // template
    const parts: (string | ExpressionNode)[] = [];

    // Parse template content until closing
    while (!this.isAtEnd()) {
      if (this.match(TokenType.TEMPLATE_START)) {
        parts.push(this.parseExpression());
        this.expect(TokenType.TEMPLATE_END, "Expected '}}'");
      } else if (this.check(TokenType.TEMPLATE_TEXT)) {
        parts.push(this.advance().value);
      } else {
        break;
      }
    }

    return { type: "TemplateStatement", parts };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression();
    this.match(TokenType.SEMICOLON);
    return { type: "ExpressionStatement", expression };
  }

  private parseExpression(): ExpressionNode {
    return this.parsePipe();
  }

  private parsePipe(): ExpressionNode {
    let left = this.parseOr();

    while (this.match(TokenType.PIPE)) {
      const right = this.parseOr();
      left = { type: "PipeExpression", left, right };
    }

    return left;
  }

  private parseOr(): ExpressionNode {
    let left = this.parseAnd();

    while (this.match(TokenType.OR)) {
      const right = this.parseAnd();
      left = { type: "BinaryExpression", operator: "||", left, right };
    }

    return left;
  }

  private parseAnd(): ExpressionNode {
    let left = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const right = this.parseEquality();
      left = { type: "BinaryExpression", operator: "&&", left, right };
    }

    return left;
  }

  private parseEquality(): ExpressionNode {
    let left = this.parseComparison();

    while (this.match(TokenType.EQUALS) || this.match(TokenType.NOT_EQUALS)) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      left = { type: "BinaryExpression", operator, left, right };
    }

    return left;
  }

  private parseComparison(): ExpressionNode {
    return this.parseTerm();
  }

  private parseTerm(): ExpressionNode {
    let left = this.parseFactor();

    while (this.match(TokenType.PLUS) || this.match(TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.parseFactor();
      left = { type: "BinaryExpression", operator, left, right };
    }

    return left;
  }

  private parseFactor(): ExpressionNode {
    let left = this.parseUnary();

    while (this.match(TokenType.MULTIPLY) || this.match(TokenType.DIVIDE) || this.match(TokenType.MODULO)) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      left = { type: "BinaryExpression", operator, left, right };
    }

    return left;
  }

  private parseUnary(): ExpressionNode {
    if (this.match(TokenType.NOT) || this.match(TokenType.MINUS)) {
      const operator = this.previous().value;
      const argument = this.parseUnary();
      return { type: "UnaryExpression", operator, argument };
    }

    return this.parseCall();
  }

  private parseCall(): ExpressionNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        const args: ExpressionNode[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.expect(TokenType.RPAREN, "Expected ')' after arguments");
        expr = { type: "CallExpression", callee: expr, arguments: args };
      } else if (this.match(TokenType.DOT)) {
        const property: Identifier = {
          type: "Identifier",
          name: this.expect(TokenType.IDENTIFIER, "Expected property name").value
        };
        expr = { type: "MemberExpression", object: expr, property, computed: false };
      } else if (this.match(TokenType.LBRACKET)) {
        const property = this.parseExpression();
        this.expect(TokenType.RBRACKET, "Expected ']'");
        expr = { type: "MemberExpression", object: expr, property, computed: true };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): ExpressionNode {
    if (this.match(TokenType.NUMBER)) {
      return { type: "Literal", value: Number(this.previous().value), raw: this.previous().value };
    }

    if (this.match(TokenType.STRING)) {
      return { type: "Literal", value: this.previous().value, raw: `"${this.previous().value}"` };
    }

    if (this.match(TokenType.BOOLEAN)) {
      return { type: "Literal", value: this.previous().value === "true", raw: this.previous().value };
    }

    if (this.match(TokenType.NULL)) {
      return { type: "Literal", value: null, raw: "null" };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return { type: "Identifier", name: this.previous().value };
    }

    if (this.match(TokenType.LBRACKET)) {
      const elements: ExpressionNode[] = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      this.expect(TokenType.RBRACKET, "Expected ']'");
      return { type: "ArrayExpression", elements };
    }

    if (this.match(TokenType.LBRACE)) {
      const properties: { key: string; value: ExpressionNode }[] = [];
      if (!this.check(TokenType.RBRACE)) {
        do {
          const key = this.expect(TokenType.IDENTIFIER, "Expected property key").value;
          this.expect(TokenType.COLON, "Expected ':' after property key");
          const value = this.parseExpression();
          properties.push({ key, value });
        } while (this.match(TokenType.COMMA));
      }
      this.expect(TokenType.RBRACE, "Expected '}'");
      return { type: "ObjectExpression", properties };
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN, "Expected ')'");
      return expr;
    }

    throw this.error(this.peek(), "Expected expression");
  }

  // Helper methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private previous(): Token {
    return this.tokens[this.pos - 1];
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): ParseError {
    const error = { message, token };
    this.errors.push(error);
    return error;
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      if (this.check(TokenType.KEYWORD)) {
        const kw = this.peek().value;
        if (["let", "const", "fn", "if", "for", "return", "import", "export"].includes(kw)) {
          return;
        }
      }
      this.advance();
    }
  }
}

export default Parser;

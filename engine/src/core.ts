// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Core Engine - odd-ssg
 * Mill-Based Synthesis Engine for Static Site Generation
 *
 * Implements the Analytical Engine paradigm:
 * - Operation Cards: Template instructions
 * - Variable Cards: Data bindings
 * - Number Cards: Content values
 * - Mill: Processing unit
 * - Store: Variable persistence
 */

export interface OperationCard {
  operation: "load" | "store" | "transform" | "emit" | "branch" | "loop";
  operands: string[];
  metadata?: Record<string, unknown>;
}

export interface VariableCard {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  value: unknown;
  readonly?: boolean;
}

export interface NumberCard {
  address: number;
  value: number | string;
  precision?: number;
}

export interface Mill {
  accumulator: unknown;
  registers: Map<string, unknown>;
  status: "idle" | "running" | "halted" | "error";

  execute(card: OperationCard): Promise<unknown>;
  reset(): void;
}

export interface Store {
  variables: Map<string, VariableCard>;

  load(name: string): VariableCard | undefined;
  save(card: VariableCard): void;
  clear(): void;
}

/**
 * Create a new Mill instance
 */
export function createMill(): Mill {
  const registers = new Map<string, unknown>();
  let accumulator: unknown = null;
  let status: Mill["status"] = "idle";

  return {
    get accumulator() { return accumulator; },
    get registers() { return registers; },
    get status() { return status; },

    async execute(card: OperationCard): Promise<unknown> {
      status = "running";
      try {
        switch (card.operation) {
          case "load":
            accumulator = registers.get(card.operands[0]);
            break;
          case "store":
            registers.set(card.operands[0], accumulator);
            break;
          case "transform":
            // Apply transformation function
            const fn = card.metadata?.transform as ((v: unknown) => unknown) | undefined;
            if (fn) accumulator = fn(accumulator);
            break;
          case "emit":
            // Output operation
            return accumulator;
          case "branch":
          case "loop":
            // Control flow handled by engine
            break;
        }
        status = "idle";
        return accumulator;
      } catch (error) {
        status = "error";
        throw error;
      }
    },

    reset() {
      accumulator = null;
      registers.clear();
      status = "idle";
    }
  };
}

/**
 * Create a new Store instance
 */
export function createStore(): Store {
  const variables = new Map<string, VariableCard>();

  return {
    get variables() { return variables; },

    load(name: string): VariableCard | undefined {
      return variables.get(name);
    },

    save(card: VariableCard): void {
      if (variables.has(card.name)) {
        const existing = variables.get(card.name)!;
        if (existing.readonly) {
          throw new Error(`Cannot modify readonly variable: ${card.name}`);
        }
      }
      variables.set(card.name, card);
    },

    clear(): void {
      variables.clear();
    }
  };
}

/**
 * Engine configuration
 */
export interface EngineConfig {
  strict?: boolean;
  maxIterations?: number;
  timeout?: number;
  plugins?: EnginePlugin[];
}

export interface EnginePlugin {
  name: string;
  version: string;
  operations?: Record<string, (mill: Mill, store: Store, operands: string[]) => Promise<unknown>>;
  transforms?: Record<string, (value: unknown) => unknown>;
}

/**
 * Main Engine class
 */
export class Engine {
  private mill: Mill;
  private store: Store;
  private config: EngineConfig;
  private plugins: Map<string, EnginePlugin>;

  constructor(config: EngineConfig = {}) {
    this.mill = createMill();
    this.store = createStore();
    this.config = {
      strict: true,
      maxIterations: 10000,
      timeout: 30000,
      ...config
    };
    this.plugins = new Map();

    // Register plugins
    for (const plugin of config.plugins ?? []) {
      this.plugins.set(plugin.name, plugin);
    }
  }

  /**
   * Execute a sequence of operation cards
   */
  async execute(cards: OperationCard[]): Promise<unknown[]> {
    const results: unknown[] = [];
    let iterations = 0;

    for (const card of cards) {
      if (iterations++ > this.config.maxIterations!) {
        throw new Error("Max iterations exceeded");
      }
      const result = await this.mill.execute(card);
      results.push(result);
    }

    return results;
  }

  /**
   * Load variables into the store
   */
  loadVariables(variables: VariableCard[]): void {
    for (const v of variables) {
      this.store.save(v);
    }
  }

  /**
   * Get current engine state
   */
  getState(): { mill: Mill["status"]; variables: number } {
    return {
      mill: this.mill.status,
      variables: this.store.variables.size
    };
  }

  /**
   * Reset engine to initial state
   */
  reset(): void {
    this.mill.reset();
    this.store.clear();
  }
}

export default Engine;

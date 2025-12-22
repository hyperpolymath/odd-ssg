// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Engine, createMill, createStore, type OperationCard, type VariableCard } from "../../engine/src/core.ts";

describe("Mill", () => {
  it("should create a mill with idle status", () => {
    const mill = createMill();
    assertEquals(mill.status, "idle");
    assertEquals(mill.accumulator, null);
  });

  it("should execute load operation", async () => {
    const mill = createMill();
    mill.registers.set("test", 42);

    const card: OperationCard = {
      operation: "load",
      operands: ["test"]
    };

    await mill.execute(card);
    assertEquals(mill.accumulator, 42);
    assertEquals(mill.status, "idle");
  });

  it("should execute store operation", async () => {
    const mill = createMill();
    mill.registers.set("source", "value");

    await mill.execute({ operation: "load", operands: ["source"] });
    await mill.execute({ operation: "store", operands: ["dest"] });

    assertEquals(mill.registers.get("dest"), "value");
  });

  it("should execute transform operation", async () => {
    const mill = createMill();
    mill.registers.set("num", 5);

    await mill.execute({ operation: "load", operands: ["num"] });
    await mill.execute({
      operation: "transform",
      operands: [],
      metadata: { transform: (v: unknown) => (v as number) * 2 }
    });

    assertEquals(mill.accumulator, 10);
  });

  it("should reset to initial state", async () => {
    const mill = createMill();
    mill.registers.set("test", 123);
    await mill.execute({ operation: "load", operands: ["test"] });

    mill.reset();

    assertEquals(mill.accumulator, null);
    assertEquals(mill.registers.size, 0);
    assertEquals(mill.status, "idle");
  });
});

describe("Store", () => {
  it("should create an empty store", () => {
    const store = createStore();
    assertEquals(store.variables.size, 0);
  });

  it("should save and load variables", () => {
    const store = createStore();
    const card: VariableCard = {
      name: "greeting",
      type: "string",
      value: "Hello"
    };

    store.save(card);
    const loaded = store.load("greeting");

    assertExists(loaded);
    assertEquals(loaded.value, "Hello");
  });

  it("should return undefined for non-existent variables", () => {
    const store = createStore();
    const result = store.load("nonexistent");
    assertEquals(result, undefined);
  });

  it("should prevent modification of readonly variables", () => {
    const store = createStore();
    store.save({
      name: "constant",
      type: "number",
      value: 42,
      readonly: true
    });

    try {
      store.save({
        name: "constant",
        type: "number",
        value: 100
      });
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Cannot modify readonly variable: constant");
    }
  });

  it("should clear all variables", () => {
    const store = createStore();
    store.save({ name: "a", type: "string", value: "1" });
    store.save({ name: "b", type: "string", value: "2" });

    store.clear();

    assertEquals(store.variables.size, 0);
  });
});

describe("Engine", () => {
  it("should create engine with default config", () => {
    const engine = new Engine();
    const state = engine.getState();

    assertEquals(state.mill, "idle");
    assertEquals(state.variables, 0);
  });

  it("should load variables into store", () => {
    const engine = new Engine();
    engine.loadVariables([
      { name: "x", type: "number", value: 1 },
      { name: "y", type: "number", value: 2 }
    ]);

    const state = engine.getState();
    assertEquals(state.variables, 2);
  });

  it("should execute operation cards", async () => {
    const engine = new Engine();
    engine.loadVariables([
      { name: "input", type: "string", value: "test" }
    ]);

    const cards: OperationCard[] = [
      { operation: "load", operands: ["input"] },
      { operation: "emit", operands: [] }
    ];

    const results = await engine.execute(cards);
    assertEquals(results[results.length - 1], "test");
  });

  it("should enforce max iterations", async () => {
    const engine = new Engine({ maxIterations: 5 });
    const cards: OperationCard[] = Array(10).fill({ operation: "load", operands: ["x"] });

    try {
      await engine.execute(cards);
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Max iterations exceeded");
    }
  });

  it("should reset engine state", () => {
    const engine = new Engine();
    engine.loadVariables([{ name: "test", type: "string", value: "data" }]);

    engine.reset();

    const state = engine.getState();
    assertEquals(state.variables, 0);
    assertEquals(state.mill, "idle");
  });
});

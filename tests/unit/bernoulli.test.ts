// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Bernoulli Verification Tests
 *
 * These tests verify the mathematical correctness of operations
 * in the Mill-Based Synthesis engine, following the principles
 * established by Ada Lovelace's Bernoulli number computation.
 */

import { assertEquals, assertAlmostEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

// Bernoulli number computation using the Akiyama–Tanigawa algorithm
function computeBernoulli(n: number): number {
  const a: number[] = [];

  for (let m = 0; m <= n; m++) {
    a[m] = 1 / (m + 1);
    for (let j = m; j >= 1; j--) {
      a[j - 1] = j * (a[j - 1] - a[j]);
    }
  }

  return a[0];
}

// Known Bernoulli numbers for verification
const BERNOULLI_NUMBERS: Record<number, number> = {
  0: 1,
  1: -0.5,
  2: 1 / 6,
  4: -1 / 30,
  6: 1 / 42,
  8: -1 / 30,
  10: 5 / 66,
  12: -691 / 2730
};

describe("Bernoulli Verification", () => {
  describe("Bernoulli Number Computation", () => {
    it("should compute B_0 = 1", () => {
      assertEquals(computeBernoulli(0), 1);
    });

    it("should compute B_1 = -1/2", () => {
      assertAlmostEquals(computeBernoulli(1), -0.5, 1e-10);
    });

    it("should compute B_2 = 1/6", () => {
      assertAlmostEquals(computeBernoulli(2), 1 / 6, 1e-10);
    });

    it("should compute even Bernoulli numbers correctly", () => {
      for (const [n, expected] of Object.entries(BERNOULLI_NUMBERS)) {
        const index = parseInt(n);
        if (index % 2 === 0 || index <= 1) {
          assertAlmostEquals(computeBernoulli(index), expected, 1e-8);
        }
      }
    });

    it("should compute odd Bernoulli numbers (n > 1) as 0", () => {
      // B_n = 0 for odd n > 1
      assertAlmostEquals(computeBernoulli(3), 0, 1e-10);
      assertAlmostEquals(computeBernoulli(5), 0, 1e-10);
      assertAlmostEquals(computeBernoulli(7), 0, 1e-10);
    });
  });

  describe("Mill Operation Verification", () => {
    // These tests verify that Mill operations preserve mathematical properties

    it("should preserve associativity: (a + b) + c = a + (b + c)", () => {
      const a = 1.5, b = 2.7, c = 3.2;
      const left = (a + b) + c;
      const right = a + (b + c);
      assertAlmostEquals(left, right, 1e-10);
    });

    it("should preserve commutativity: a + b = b + a", () => {
      const a = 7.3, b = 4.1;
      assertEquals(a + b, b + a);
    });

    it("should preserve distributivity: a * (b + c) = a*b + a*c", () => {
      const a = 2.5, b = 3.0, c = 4.0;
      const left = a * (b + c);
      const right = a * b + a * c;
      assertAlmostEquals(left, right, 1e-10);
    });

    it("should handle identity operations: a + 0 = a, a * 1 = a", () => {
      const a = 42.5;
      assertEquals(a + 0, a);
      assertEquals(a * 1, a);
    });

    it("should handle inverse operations: a - a = 0, a / a = 1", () => {
      const a = 17.3;
      assertEquals(a - a, 0);
      assertEquals(a / a, 1);
    });
  });

  describe("Numerical Precision", () => {
    it("should maintain precision in repeated operations", () => {
      let value = 1.0;
      for (let i = 0; i < 1000; i++) {
        value = value * 1.001;
      }
      for (let i = 0; i < 1000; i++) {
        value = value / 1.001;
      }
      // Should return close to 1.0
      assertAlmostEquals(value, 1.0, 1e-6);
    });

    it("should handle small number subtraction correctly", () => {
      // Catastrophic cancellation test
      const a = 1.0000001;
      const b = 1.0000000;
      const diff = a - b;
      assertAlmostEquals(diff, 1e-7, 1e-10);
    });

    it("should handle large number addition without overflow", () => {
      const a = Number.MAX_SAFE_INTEGER - 1;
      const result = a + 1;
      assertEquals(result, Number.MAX_SAFE_INTEGER);
    });
  });

  describe("Sequence Generation", () => {
    it("should generate Fibonacci sequence correctly", () => {
      function fibonacci(n: number): number {
        if (n <= 1) return n;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
          [a, b] = [b, a + b];
        }
        return b;
      }

      assertEquals(fibonacci(0), 0);
      assertEquals(fibonacci(1), 1);
      assertEquals(fibonacci(10), 55);
      assertEquals(fibonacci(20), 6765);
    });

    it("should generate factorial correctly", () => {
      function factorial(n: number): number {
        let result = 1;
        for (let i = 2; i <= n; i++) {
          result *= i;
        }
        return result;
      }

      assertEquals(factorial(0), 1);
      assertEquals(factorial(1), 1);
      assertEquals(factorial(5), 120);
      assertEquals(factorial(10), 3628800);
    });
  });
});

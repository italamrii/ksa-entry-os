/**
 * Declarative, deterministic condition evaluation for the rules engine.
 *
 * Conditions are a plain-data tree — never executable code. There is no eval,
 * no dynamic function construction, and no network access. Evaluating the same
 * condition against the same facts always yields the same result.
 */

export type FactPrimitive = string | number | boolean | null;
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface NormalizedFact {
  value: FactPrimitive;
  /** Whether the user provided this directly, or the engine inferred it. */
  source: "provided" | "inferred";
  confidence: ConfidenceLevel;
  /** Optional human-facing label keys for explanation rendering. */
  labelEn?: string;
  labelAr?: string;
}

export type FactSet = Record<string, NormalizedFact>;

export type Condition =
  | { op: "eq" | "neq" | "contains"; fact: string; value: FactPrimitive }
  | { op: "in" | "nin"; fact: string; value: FactPrimitive[] }
  | { op: "exists" | "nexists"; fact: string }
  | { op: "bool"; fact: string; value: boolean }
  | { op: "range"; fact: string; min?: number; max?: number }
  | { op: "all" | "any"; conditions: Condition[] };

export class RuleConditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleConditionError";
  }
}

const LEAF_OPS = new Set(["eq", "neq", "contains", "in", "nin", "exists", "nexists", "bool", "range"]);
const GROUP_OPS = new Set(["all", "any"]);

/**
 * Validate a condition tree, throwing RuleConditionError on any malformed node.
 * Invalid conditions must be rejected — never silently treated as matching.
 */
export function validateCondition(cond: unknown, path = "$"): void {
  if (!cond || typeof cond !== "object") {
    throw new RuleConditionError(`${path}: condition must be an object`);
  }
  const c = cond as Record<string, unknown>;
  const op = c.op;
  if (typeof op !== "string" || (!LEAF_OPS.has(op) && !GROUP_OPS.has(op))) {
    throw new RuleConditionError(`${path}: unknown operator ${JSON.stringify(op)}`);
  }

  if (GROUP_OPS.has(op)) {
    if (!Array.isArray(c.conditions)) {
      throw new RuleConditionError(`${path}.${op}: expected "conditions" array`);
    }
    c.conditions.forEach((child, i) => validateCondition(child, `${path}.${op}[${i}]`));
    return;
  }

  if (typeof c.fact !== "string" || c.fact.length === 0) {
    throw new RuleConditionError(`${path}.${op}: expected non-empty "fact"`);
  }
  if ((op === "in" || op === "nin") && !Array.isArray(c.value)) {
    throw new RuleConditionError(`${path}.${op}: expected "value" array`);
  }
  if (op === "bool" && typeof c.value !== "boolean") {
    throw new RuleConditionError(`${path}.${op}: expected boolean "value"`);
  }
  if (op === "range" && c.min === undefined && c.max === undefined) {
    throw new RuleConditionError(`${path}.range: expected "min" and/or "max"`);
  }
}

export interface ConditionResult {
  matched: boolean;
  /** Fact keys that were referenced while evaluating (for explainability). */
  usedFacts: string[];
  /** Leaf facts that caused a non-match (for exclusion reasons). */
  failedFacts: string[];
}

function factValue(facts: FactSet, key: string): FactPrimitive | undefined {
  const f = facts[key];
  return f ? f.value : undefined;
}

/**
 * Evaluate a (pre-validated) condition against a fact set. Pure and total —
 * a missing fact is treated as "not satisfied", never an error.
 */
export function evaluateCondition(cond: Condition, facts: FactSet): ConditionResult {
  switch (cond.op) {
    case "all": {
      const used: string[] = [];
      const failed: string[] = [];
      let matched = true;
      for (const child of cond.conditions) {
        const r = evaluateCondition(child, facts);
        used.push(...r.usedFacts);
        if (!r.matched) {
          matched = false;
          failed.push(...r.failedFacts);
        }
      }
      return { matched, usedFacts: unique(used), failedFacts: unique(failed) };
    }
    case "any": {
      const used: string[] = [];
      const failed: string[] = [];
      let matched = cond.conditions.length === 0 ? false : false;
      for (const child of cond.conditions) {
        const r = evaluateCondition(child, facts);
        used.push(...r.usedFacts);
        if (r.matched) matched = true;
        else failed.push(...r.failedFacts);
      }
      return { matched, usedFacts: unique(used), failedFacts: matched ? [] : unique(failed) };
    }
    default: {
      const matched = evaluateLeaf(cond, facts);
      return { matched, usedFacts: [cond.fact], failedFacts: matched ? [] : [cond.fact] };
    }
  }
}

function evaluateLeaf(cond: Exclude<Condition, { op: "all" | "any" }>, facts: FactSet): boolean {
  const v = factValue(facts, cond.fact);
  switch (cond.op) {
    case "exists":
      return v !== undefined && v !== null;
    case "nexists":
      return v === undefined || v === null;
    case "eq":
      return v === cond.value;
    case "neq":
      return v !== cond.value;
    case "bool":
      return v === cond.value;
    case "in":
      return cond.value.includes(v as FactPrimitive);
    case "nin":
      return !cond.value.includes(v as FactPrimitive);
    case "contains":
      return typeof v === "string" && typeof cond.value === "string" && v.includes(cond.value);
    case "range": {
      if (typeof v !== "number") return false;
      if (cond.min !== undefined && v < cond.min) return false;
      if (cond.max !== undefined && v > cond.max) return false;
      return true;
    }
    default:
      return false;
  }
}

function unique(xs: string[]): string[] {
  return [...new Set(xs)];
}

'use strict';
/**
 * pgvector <-> JS array transformer for TypeORM column declarations.
 *
 *   to(value):   number[]  -> '[1.0,2.0,3.0]'  (Postgres vector literal)
 *   from(value): string    -> number[]
 *
 * Why string? pgvector returns the column as text by default unless a
 * pgvector-aware driver is wired up; this transformer keeps it portable
 * across `node-postgres` versions.
 */

const vectorTransformer = {
  to(value) {
    if (value == null) return null;
    if (!Array.isArray(value)) {
      throw new TypeError('vector column expects number[]');
    }
    // Compact form, no spaces — pgvector accepts JSON-array-like syntax.
    return `[${value.map(Number).join(',')}]`;
  },
  from(value) {
    if (value == null) return null;
    if (Array.isArray(value)) return value;
    // pgvector text form: "[1,2,3]"
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    const inner = trimmed.replace(/^\[|\]$/g, '');
    if (!inner) return [];
    return inner.split(',').map((s) => Number(s));
  },
};

module.exports = { vectorTransformer };

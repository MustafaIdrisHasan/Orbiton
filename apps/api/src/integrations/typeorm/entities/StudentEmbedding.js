'use strict';
/**
 * StudentEmbedding — view of the `students` table scoped to the columns
 * the intelligence layer cares about. We do NOT define the full Student
 * entity here to avoid colliding with the existing students module that
 * uses raw SQL; this entity owns only the embedding/skills/timestamps.
 */

const { EntitySchema } = require('typeorm');
const { vectorTransformer } = require('../transformers/vector');

module.exports = new EntitySchema({
  name: 'StudentEmbedding',
  tableName: 'students',
  columns: {
    id: { type: 'uuid', primary: true },
    profile_embedding: {
      type: 'varchar',          // declared as `vector(768)` in SQL — TypeORM has no native type
      nullable: true,
      transformer: vectorTransformer,
    },
    skills_normalized: {
      type: 'simple-array',     // text[] in PG; TypeORM's simple-array works for our use
      nullable: true,
    },
    embedding_model_version: { type: 'text', nullable: true },
    embedding_computed_at: { type: 'timestamptz', nullable: true },
  },
});

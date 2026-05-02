'use strict';

const { EntitySchema } = require('typeorm');
const { vectorTransformer } = require('../transformers/vector');

module.exports = new EntitySchema({
  name: 'DriveEmbedding',
  tableName: 'drives',
  columns: {
    id: { type: 'uuid', primary: true },
    jd_embedding: {
      type: 'varchar',
      nullable: true,
      transformer: vectorTransformer,
    },
    required_skills: { type: 'simple-array', nullable: true },
    preferred_skills: { type: 'simple-array', nullable: true },
    min_cgpa: { type: 'numeric', precision: 4, scale: 2, nullable: true },
    min_experience_years: { type: 'numeric', precision: 4, scale: 2, nullable: true },
    embedding_model_version: { type: 'text', nullable: true },
    embedding_computed_at: { type: 'timestamptz', nullable: true },
  },
});

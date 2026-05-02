'use strict';

const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MatchRun',
  tableName: 'match_runs',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    student_id: { type: 'uuid' },
    drive_id: { type: 'uuid' },
    cosine_similarity: { type: 'numeric', precision: 6, scale: 5 },
    skill_jaccard: { type: 'numeric', precision: 6, scale: 5, nullable: true },
    experience_fit: { type: 'numeric', precision: 6, scale: 5, nullable: true },
    cgpa_fit: { type: 'numeric', precision: 6, scale: 5, nullable: true },
    composite_score: { type: 'numeric', precision: 6, scale: 5 },
    boolean_pass: { type: 'boolean' },
    explanations: { type: 'jsonb', default: () => "'{}'::jsonb" },
    model_version: { type: 'text' },
    computed_at: { type: 'timestamptz', createDate: true },
  },
});

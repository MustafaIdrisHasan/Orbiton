'use strict';

const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MatchingConfig',
  tableName: 'matching_config',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    institution_id: { type: 'uuid', nullable: true },
    cosine_weight: { type: 'numeric', precision: 4, scale: 3, default: 0.55 },
    skill_jaccard_weight: { type: 'numeric', precision: 4, scale: 3, default: 0.25 },
    experience_fit_weight: { type: 'numeric', precision: 4, scale: 3, default: 0.10 },
    cgpa_fit_weight: { type: 'numeric', precision: 4, scale: 3, default: 0.10 },
    enforce_mandatory_skills: { type: 'boolean', default: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});

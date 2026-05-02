'use strict';

const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ResumeParse',
  tableName: 'resume_parses',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    resume_id: { type: 'uuid' },
    status: { type: 'text' },           // queued | parsing | succeeded | failed
    json_resume: { type: 'jsonb', nullable: true },
    raw_text_chars: { type: 'integer', nullable: true },
    parse_version: { type: 'text' },
    model_version: { type: 'text' },
    failure_reason: { type: 'text', nullable: true },
    duration_ms: { type: 'integer', nullable: true },
    computed_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { name: 'idx_resume_parses_resume_id', columns: ['resume_id', 'computed_at'] },
  ],
});

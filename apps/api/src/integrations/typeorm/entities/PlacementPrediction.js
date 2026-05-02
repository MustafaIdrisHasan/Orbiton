'use strict';

const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'PlacementPrediction',
  tableName: 'placement_predictions',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    student_id: { type: 'uuid' },
    probability: { type: 'numeric', precision: 6, scale: 5 },
    risk_band: { type: 'text' },        // low | medium | high
    feature_contributions: { type: 'jsonb', default: () => "'{}'::jsonb" },
    features_snapshot: { type: 'jsonb', default: () => "'{}'::jsonb" },
    model_version: { type: 'text' },
    computed_at: { type: 'timestamptz', createDate: true },
  },
});

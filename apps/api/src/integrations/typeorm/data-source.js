'use strict';
/**
 * TypeORM DataSource — scoped to the new intelligence-layer entities ONLY.
 *
 * The rest of the API still uses raw `pg` / mock stores; we deliberately do
 * not migrate the entire codebase to TypeORM here (Option B from the plan).
 * Run `await getDataSource()` once at boot and reuse the singleton.
 *
 * pgvector storage: vectors are exposed as `number[]` in JS and read/written
 * as the `vector` Postgres type via the `vectorTransformer` in
 * ./transformers/vector.js.
 */

const { DataSource } = require('typeorm');

const StudentEmbedding = require('./entities/StudentEmbedding');
const DriveEmbedding = require('./entities/DriveEmbedding');
const ResumeParse = require('./entities/ResumeParse');
const MatchRun = require('./entities/MatchRun');
const PlacementPrediction = require('./entities/PlacementPrediction');
const MatchingConfig = require('./entities/MatchingConfig');

let dataSource = null;

function buildDataSource() {
  return new DataSource({
    type: 'postgres',
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.PG_DSN,
    synchronize: false,           // migrations live in infrastructure/db
    logging: process.env.TYPEORM_LOG === 'true',
    entities: [
      StudentEmbedding,
      DriveEmbedding,
      ResumeParse,
      MatchRun,
      PlacementPrediction,
      MatchingConfig,
    ],
  });
}

async function getDataSource() {
  if (dataSource && dataSource.isInitialized) return dataSource;
  if (!dataSource) dataSource = buildDataSource();
  if (!dataSource.isInitialized) await dataSource.initialize();
  return dataSource;
}

async function closeDataSource() {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
  }
}

module.exports = { getDataSource, closeDataSource };

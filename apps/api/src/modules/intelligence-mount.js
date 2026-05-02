'use strict';
/**
 * Helper: mount all new intelligence-layer routers on the main API.
 *
 * Wire this from `apps/api/src/modules/index.js` (the file that already
 * mounts routes per the HANDOVER) without editing it inline:
 *
 *   const mountIntelligence = require('./intelligence-mount');
 *   mountIntelligence(app);
 *
 * If you'd rather wire it directly into modules/index.js, copy the three
 * `app.use(...)` lines below into your existing mount function.
 */

module.exports = function mountIntelligence(app) {
  app.use('/api/v1/internal',         require('./internal'));
  app.use('/api/v1/matching',         require('./matching'));
  app.use('/api/v1/predictions',      require('./predictions'));

  // Resumes intelligence routes are mounted under the existing /resumes
  // base alongside the existing routers in your resumes module. If your
  // existing mount uses a sub-router, add this line to that file:
  //   subRouter.use('/', require('./intelligence.routes'));
  // We expose it here as a fallback for projects without a sub-router.
  try {
    app.use('/api/v1/resumes', require('./resumes/intelligence.routes'));
  } catch (e) {
    // intentionally non-fatal during migration
  }
};

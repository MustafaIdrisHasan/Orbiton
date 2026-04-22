const express = require("express");
const { getStorageAdapter } = require("../../integrations/storage");
const { createModuleRouter } = require("../../core/utils/createModuleRouter");

const router = createModuleRouter("resumes");

router.get("/storage/adapter", (_req, res) => {
  res.json(getStorageAdapter());
});

module.exports = router;


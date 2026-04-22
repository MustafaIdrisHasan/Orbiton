const express = require("express");

function createModuleRouter(resourceName) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    res.json({
      resource: resourceName,
      items: [],
      message: `${resourceName} list endpoint ready for implementation`
    });
  });

  router.get("/:id", (req, res) => {
    res.json({
      resource: resourceName,
      id: req.params.id,
      message: `${resourceName} detail endpoint ready for implementation`
    });
  });

  router.post("/", (req, res) => {
    res.status(201).json({
      resource: resourceName,
      payload: req.body,
      message: `${resourceName} create endpoint ready for implementation`
    });
  });

  router.patch("/:id", (req, res) => {
    res.json({
      resource: resourceName,
      id: req.params.id,
      payload: req.body,
      message: `${resourceName} update endpoint ready for implementation`
    });
  });

  router.delete("/:id", (_req, res) => {
    res.status(204).send();
  });

  return router;
}

module.exports = {
  createModuleRouter
};


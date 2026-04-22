const { env } = require("../../config/env");

function getStorageAdapter() {
  return {
    provider: "object-storage",
    bucket: env.storageBucket
  };
}

module.exports = {
  getStorageAdapter
};


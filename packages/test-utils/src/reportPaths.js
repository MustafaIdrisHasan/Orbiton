const path = require("path");

function getReportPath(...segments) {
  return path.join(process.cwd(), "reports", ...segments);
}

module.exports = {
  getReportPath
};


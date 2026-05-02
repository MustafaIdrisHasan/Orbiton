const service = require("./service");

function listCompanies(_req, res) {
  const items = service.listCompanies();
  res.json({ resource: "companies", items });
}

function getCompany(req, res) {
  const company = service.getCompanyById(req.params.id);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }
  res.json(company);
}

module.exports = {
  listCompanies,
  getCompany
};

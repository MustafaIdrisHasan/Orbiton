const repository = require("./repository");

function listRounds() {
  return repository.listRounds();
}

function listInterviews(driveId) {
  return repository.listRounds().filter((interview) => !driveId || interview.driveId === driveId);
}

function createInterview(payload) {
  return repository.createInterview(payload);
}

module.exports = {
  listRounds,
  listInterviews,
  createInterview
};

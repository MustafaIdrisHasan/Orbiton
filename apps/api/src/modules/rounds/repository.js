const { recruiterStore } = require("../recruiters/mockData");

function listRounds() {
  return recruiterStore.interviews;
}

function createInterview(payload) {
  const interview = {
    id: `int-${Date.now()}`,
    driveId: payload.driveId,
    candidateId: payload.candidateId,
    candidateName: payload.candidateName || "Candidate",
    round: payload.round || "Final Interview",
    slot: payload.slot || new Date().toISOString(),
    mode: payload.mode || "Online",
    panel: payload.panel || "TBD",
    feedbackStatus: "PENDING"
  };

  recruiterStore.interviews.push(interview);
  return interview;
}

module.exports = {
  listRounds,
  createInterview
};

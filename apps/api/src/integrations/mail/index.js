function sendMail(message) {
  return {
    queued: true,
    provider: "stub",
    message
  };
}

module.exports = {
  sendMail
};


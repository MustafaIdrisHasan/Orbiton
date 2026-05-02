function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function encodeStudent(profile, vocab) {
  const skillSet = new Set((profile?.skills || []).map(lower).filter(Boolean));
  const branchUpper = upper(profile?.education?.branch || profile?.department || profile?.branch);

  const vec = new Array(vocab.dim()).fill(0);
  for (let i = 0; i < vocab.skills.length; i += 1) {
    if (skillSet.has(vocab.skills[i])) {
      vec[i] = 1;
    }
  }
  const offset = vocab.skills.length;
  for (let j = 0; j < vocab.branches.length; j += 1) {
    if (vocab.branches[j] === branchUpper) {
      vec[offset + j] = 1;
    }
  }
  return vec;
}

function encodeDrive(drive, vocab) {
  const requiredSet = new Set((drive?.requiredSkills || []).map(lower).filter(Boolean));
  const eligibleSet = new Set(
    (drive?.eligibleDepartments || []).map(upper).filter(Boolean)
  );

  const vec = new Array(vocab.dim()).fill(0);
  for (let i = 0; i < vocab.skills.length; i += 1) {
    if (requiredSet.has(vocab.skills[i])) {
      vec[i] = 1;
    }
  }
  const offset = vocab.skills.length;
  for (let j = 0; j < vocab.branches.length; j += 1) {
    if (eligibleSet.has(vocab.branches[j])) {
      vec[offset + j] = 1;
    }
  }
  return vec;
}

function topContributingDimensions(studentVec, driveVec, vocab, limit = 5) {
  const matches = [];
  for (let i = 0; i < vocab.skills.length; i += 1) {
    if (studentVec[i] > 0 && driveVec[i] > 0) {
      matches.push(vocab.skills[i]);
    }
  }
  return matches.slice(0, limit);
}

module.exports = {
  encodeStudent,
  encodeDrive,
  topContributingDimensions
};

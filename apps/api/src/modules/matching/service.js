const drivesService = require("../drives/service");
const resumeStore = require("../resumes/store");
const { recruiterStore } = require("../recruiters/mockData");
const { getVocabulary } = require("./vocabulary");
const { encodeStudent, encodeDrive, topContributingDimensions } = require("./encoder");
const { cosine } = require("./similarity");
const { skillsAlignForRecommendation } = require("./skillGate");

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

async function fallbackProfileForStudent(studentId) {
  const stored = await resumeStore.getProfile(studentId);
  if (stored) {
    return stored;
  }
  return {
    skills: [],
    education: { cgpa: 8.6, branch: "CSE", degree: "B.Tech", year: "Final Year" },
    projects: [],
    experience: []
  };
}

async function rankDrivesForStudent(studentId) {
  const profile = await fallbackProfileForStudent(studentId);
  const vocab = getVocabulary();
  const studentVec = encodeStudent(profile, vocab);

  const drives = drivesService.listDrives();
  const items = drives
    .filter((drive) => skillsAlignForRecommendation(profile, drive))
    .map((drive) => {
      const driveVec = encodeDrive(drive, vocab);
      const sim = cosine(studentVec, driveVec);
      const matches = topContributingDimensions(studentVec, driveVec, vocab);
      return {
        driveId: drive.id,
        title: drive.title,
        companyName: drive.companyName,
        similarity: round4(sim),
        matchPercent: Math.round(sim * 100),
        topContributingDimensions: matches
      };
    });

  items.sort((a, b) => b.similarity - a.similarity);

  return {
    vocabularyVersion: vocab.version,
    studentId,
    items,
    skillFilter: "required_skills_subset_of_student"
  };
}

function candidateAsProfile(candidate) {
  return {
    candidateId: candidate.id,
    name: candidate.name,
    email: candidate.email,
    skills: candidate.skills || [],
    education: {
      cgpa: candidate.cgpa,
      branch: candidate.branch,
      year: candidate.year
    }
  };
}

function listAllCandidates() {
  const seen = new Map();
  for (const drive of recruiterStore.drives || []) {
    for (const candidate of drive.candidates || []) {
      if (candidate?.id && !seen.has(candidate.id)) {
        seen.set(candidate.id, candidate);
      }
    }
  }
  return Array.from(seen.values());
}

function rankStudentsForDrive(driveId) {
  const drive = drivesService.getDrive(driveId);
  if (!drive) {
    return null;
  }
  const vocab = getVocabulary();
  const driveVec = encodeDrive(drive, vocab);

  const candidates = listAllCandidates().map(candidateAsProfile);
  const items = candidates.map((profile) => {
    const studentVec = encodeStudent(profile, vocab);
    const sim = cosine(studentVec, driveVec);
    const matches = topContributingDimensions(studentVec, driveVec, vocab);
    return {
      candidateId: profile.candidateId,
      name: profile.name,
      email: profile.email,
      branch: profile.education.branch,
      cgpa: profile.education.cgpa,
      similarity: round4(sim),
      matchPercent: Math.round(sim * 100),
      topContributingDimensions: matches
    };
  });

  items.sort((a, b) => b.similarity - a.similarity);

  return {
    vocabularyVersion: vocab.version,
    driveId,
    driveTitle: drive.title,
    items
  };
}

module.exports = {
  rankDrivesForStudent,
  rankStudentsForDrive,
  fallbackProfileForStudent,
  listAllCandidates
};

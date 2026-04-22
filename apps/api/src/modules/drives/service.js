const repository = require("./repository");

function toDriveSummary(drive) {
  return {
    id: drive.id,
    title: drive.title,
    description: drive.description,
    openings: drive.openings,
    location: drive.location,
    applicationDeadline: drive.applicationDeadline,
    status: drive.status,
    isFeatured: drive.isFeatured,
    candidateCount: drive.candidates.length
  };
}

function listDrives() {
  return repository.listDrives().map(toDriveSummary);
}

function getDrive(id) {
  const drive = repository.getDriveById(id);
  return drive ? toDriveSummary(drive) : null;
}

function createDrive(payload) {
  return toDriveSummary(repository.createDrive(payload));
}

function updateDrive(id, payload) {
  const drive = repository.updateDrive(id, payload);
  return drive ? toDriveSummary(drive) : null;
}

function deleteDrive(id) {
  return repository.deleteDrive(id);
}

function listFeaturedDrives() {
  return repository.listDrives().filter((drive) => drive.isFeatured).map(toDriveSummary);
}

function listRecruiterDriveOptions() {
  return repository.listDrives().map((drive) => ({
    id: drive.id,
    title: drive.title,
    openings: drive.openings,
    applicationDeadline: drive.applicationDeadline,
    status: drive.status
  }));
}

function getDashboardDrive(driveId) {
  return repository.getDriveById(driveId) || repository.listDrives()[0] || null;
}

module.exports = {
  listDrives,
  getDrive,
  createDrive,
  updateDrive,
  deleteDrive,
  listFeaturedDrives,
  listRecruiterDriveOptions,
  getDashboardDrive
};

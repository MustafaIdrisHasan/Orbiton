function isEligibleForDrive(student, drive) {
  if (!student || !drive) {
    return false;
  }

  const hasCgpa = Number(student.cgpa || 0) >= Number(drive.minCgpa || 0);
  const hasBacklogs = Number(student.backlogCount || 0) <= Number(drive.maxBacklogs || 0);
  const departmentAllowed =
    !Array.isArray(drive.eligibleDepartments) ||
    drive.eligibleDepartments.length === 0 ||
    drive.eligibleDepartments.includes(student.department);

  return hasCgpa && hasBacklogs && departmentAllowed;
}

module.exports = {
  isEligibleForDrive
};


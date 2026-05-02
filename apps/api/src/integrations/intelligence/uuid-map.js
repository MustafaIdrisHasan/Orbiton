"use strict";

const crypto = require("crypto");

/**
 * Deterministic UUID-shaped strings for Pydantic `UUID` fields when app IDs
 * are opaque strings (e.g. drive-northstar-ase, demo-user).
 */
function hashUuid(namespace, externalId) {
  const h = crypto
    .createHash("sha256")
    .update(`${namespace}:${String(externalId)}`)
    .digest();
  const buf = Buffer.from(h.subarray(0, 16));
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = buf.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function createIdScope() {
  const driveMap = new Map();
  const studentMap = new Map();
  return {
    driveToUuid(driveId) {
      const u = hashUuid("orbiton:drive", driveId);
      driveMap.set(u, String(driveId));
      return u;
    },
    studentToUuid(studentId) {
      const u = hashUuid("orbiton:student", studentId);
      studentMap.set(u, String(studentId));
      return u;
    },
    rewriteMatchResult(r) {
      if (!r) return r;
      const du = String(r.drive_id ?? r.driveId ?? "");
      const su = String(r.student_id ?? r.studentId ?? "");
      return {
        ...r,
        drive_id: driveMap.get(du) ?? r.drive_id,
        student_id: studentMap.get(su) ?? r.student_id
      };
    }
  };
}

module.exports = { hashUuid, createIdScope };

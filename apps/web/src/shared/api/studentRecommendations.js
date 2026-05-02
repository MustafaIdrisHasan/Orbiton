function normSkillToken(value) {
  return String(value || "").trim().toLowerCase();
}

/** Union of required + optional drive skill fields for overlap scoring. */
function driveSkillTokens(d) {
  const raw = [...(d.requiredSkills || []), ...(d.skills || [])];
  return [...new Set(raw.map(normSkillToken).filter(Boolean))];
}

/**
 * Rule-based recommendations for normalized drive cards + student profile.
 * @param {object[]} drives normalized drives (status "Open" | "Closed")
 * @param {object|null} profile
 */
export function pickRecommendedDrives(drives, profile) {
  const open = drives.filter((d) => d.status === "Open");
  if (!profile) {
    return open.slice(0, 4);
  }

  const dept = String(profile.department || "").trim();
  const cgpa = Number(profile.cgpa) || 0;
  const skillSet = new Set((profile.skills || []).map(normSkillToken).filter(Boolean));

  // requiredSkills drives need at least one required skill on the profile; scoring uses union(requiredSkills, skills).
  const scored = open
    .map((d) => {
      const requiredNorm = (d.requiredSkills || []).map(normSkillToken).filter(Boolean);
      if (requiredNorm.length > 0) {
        const overlapRequired = requiredNorm.filter((r) => skillSet.has(r)).length;
        if (overlapRequired === 0) {
          return null;
        }
      }

      let score = 0;
      for (const sk of driveSkillTokens(d)) {
        if (skillSet.has(sk)) {
          score += 2;
        }
      }

      if (dept && (!d.eligibleDepartments?.length || d.eligibleDepartments.includes(dept))) {
        score += 3;
      }

      if (d.minCgpa != null && cgpa >= d.minCgpa) {
        score += 2;
      }

      const fullFit = requiredNorm.length === 0 || requiredNorm.every((r) => skillSet.has(r));
      if (fullFit) {
        score += 1;
      }

      return { drive: d, score };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return String(b.drive.deadlineAt || "").localeCompare(String(a.drive.deadlineAt || ""));
    });

  const picked = scored.filter((s) => s.score > 0).map((s) => s.drive);
  if (picked.length > 0) {
    return picked.slice(0, 6);
  }
  if (skillSet.size === 0) {
    return open.slice(0, 4);
  }
  return open
    .filter((d) => {
      const requiredNorm = (d.requiredSkills || []).map(normSkillToken).filter(Boolean);
      if (requiredNorm.length === 0) {
        return true;
      }
      return requiredNorm.some((r) => skillSet.has(r));
    })
    .slice(0, 4);
}

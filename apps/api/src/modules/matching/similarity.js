function dot(a, b) {
  let total = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    total += a[i] * b[i];
  }
  return total;
}

function norm(v) {
  let total = 0;
  for (let i = 0; i < v.length; i += 1) {
    total += v[i] * v[i];
  }
  return Math.sqrt(total);
}

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }
  const denom = norm(a) * norm(b);
  if (denom === 0) {
    return 0;
  }
  return dot(a, b) / denom;
}

module.exports = {
  cosine,
  dot,
  norm
};

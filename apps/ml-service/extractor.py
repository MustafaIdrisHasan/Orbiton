"""Offline résumé entity extractor.

Goal: take raw text produced by `pdf-parse` upstream and return a structured
profile object that the Express scorer (`apps/api/src/modules/resumes/scoring`)
can consume directly. The extractor is **fully offline** — no cloud LLMs.

Two layers:
1. **Regex-based baseline** (stdlib only, always available). Extracts a broad
   set of technical skills, CGPA, branch, degree, project blocks, and
   experience duration with internship detection.
2. **Optional spaCy enhancement** — used only if `spacy` is importable and the
   `en_core_web_sm` model loads. Adds organization (ORG) entities under
   `profile.organizations`. The baseline result is unchanged; spaCy only
   *adds* metadata.

If spaCy is missing or its model isn't downloaded, the regex baseline runs
unchanged. The Express upload handler falls back to its own legacy keyword
sniffer when this whole service is unreachable, so there are three layers of
graceful degradation in total.

Returned profile shape (compatible with `scorer.score`):

    {
      "skills":              ["react", "node.js", ...],
      "education":           {"cgpa": 8.6, "branch": "CSE", "degree": "B.Tech"},
      "projects":            [{"title": "...", "description": "...", "tech": [...]}],
      "experience":          [{"role": "...", "durationMonths": 6, "internship": True}],
      "extractedTextLength": 3942,
      "extractor":           {"engine": "regex", "version": "ext-v0.2.1"},
      "organizations":       ["Northstar AI", ...]   # only when spaCy is loaded
    }
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional


EXTRACTOR_VERSION = "ext-v0.2.1"


_NLP = None
try:
    import spacy  # type: ignore

    try:
        _NLP = spacy.load("en_core_web_sm")
    except Exception:
        _NLP = None
except ImportError:
    _NLP = None


# Skills vocabulary. Multi-word entries are matched as exact phrases (after
# lowercasing) so e.g. "system design" still matches; entries with dots like
# "node.js" use a custom non-alphanumeric boundary so they don't accidentally
# match "nodejs" (which is a separate, also valid skill listed below).
SKILL_VOCAB: List[str] = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "kotlin", "swift", "ruby", "php", "scala", "r",
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte",
    "html", "css", "sass", "tailwind", "bootstrap", "redux",
    "node.js", "nodejs", "express", "express.js", "fastapi", "flask",
    "django", "spring", "spring boot", "rails", "asp.net",
    "sql", "mysql", "postgres", "postgresql", "mongodb", "redis", "sqlite",
    "oracle", "cassandra", "dynamodb", "elasticsearch",
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "matplotlib",
    "seaborn", "spark", "hadoop", "airflow",
    "git", "linux", "bash", "rest", "graphql", "system design",
    "microservices", "agile", "scrum", "ci/cd",
    "selenium", "junit", "pytest", "kafka", "rabbitmq", "websockets",
    "oauth", "jwt",
]


# Extra single-token / phrase signals for “technical” projects when no SKILL_VOCAB
# pattern matched. Kept free of ultra-common English homographs (e.g. plain “go”).
_PROJECT_TECH_TOKEN_SET: frozenset = frozenset(
    {
        "api",
        "apis",
        "sdk",
        "rest",
        "graphql",
        "grpc",
        "http",
        "https",
        "tcp",
        "udp",
        "ssh",
        "cli",
        "sql",
        "nosql",
        "crud",
        "orm",
        "ddl",
        "dml",
        "backend",
        "frontend",
        "fullstack",
        "microservice",
        "microservices",
        "server",
        "servers",
        "client",
        "database",
        "databases",
        "network",
        "networks",
        "cloud",
        "saas",
        "paas",
        "iaas",
        "devops",
        "deploy",
        "deployment",
        "kubernetes",
        "docker",
        "terraform",
        "ansible",
        "jenkins",
        "pipeline",
        "pipelines",
        "ci",
        "cd",
        "oauth",
        "jwt",
        "ldap",
        "ssl",
        "tls",
        "encryption",
        "authentication",
        "authorization",
        "blockchain",
        "cryptography",
        "compiler",
        "parsing",
        "parser",
        "regex",
        "scraping",
        "crawler",
        "etl",
        "gpu",
        "cuda",
        "algorithm",
        "algorithms",
        "architecture",
        "scalable",
        "latency",
        "throughput",
        "cache",
        "caching",
        "sharding",
        "replication",
        "websocket",
        "websockets",
        "multithreading",
        "concurrency",
        "parallel",
        "distributed",
        "tensorflow",
        "pytorch",
        "keras",
        "opencv",
        "nlp",
        "cnn",
        "rnn",
        "lstm",
        "gan",
        "mlops",
        "jupyter",
        "numpy",
        "pandas",
        "matplotlib",
        "linux",
        "ubuntu",
        "kernel",
        "firmware",
        "embedded",
        "iot",
        "arduino",
        "raspberry",
        "fpga",
        "verilog",
        "vhdl",
        "git",
        "github",
        "gitlab",
        "bitbucket",
        "jira",
        "agile",
        "scrum",
        "kanban",
        "analytics",
        "intelligence",
        "predictive",
        "forecast",
        "forecasting",
        "moderation",
        "ensemble",
        "diagnostic",
        "multimodal",
        "inference",
        "explainable",
    }
)

_PROJECT_TECH_PHRASES: tuple = (
    "machine learning",
    "deep learning",
    "data science",
    "computer vision",
    "natural language",
    "software engineering",
    "web development",
    "mobile app",
    "mobile application",
    "full stack",
    "object oriented",
    "operating system",
    "distributed systems",
    "system design",
    "unit test",
    "integration test",
    "code review",
    "open source",
    "tech stack",
    "version control",
    "supply chain",
    "agentic",
)


def _clamp_cgpa_ten(value: float) -> float:
    return round(min(10.0, max(0.0, value)), 2)


def _from_four_point_scale(numerator: float) -> float:
    """Map US-style 4.0 GPA to the 10-point scale the Node scorer expects."""
    return _clamp_cgpa_ten((numerator / 4.0) * 10.0)


def _extract_cgpa(text: str) -> Optional[float]:
    """Return CGPA on a **10.0 scale** for `features.scoreEducation`.

    The Node scorer uses ``(cgpa - 5) / 5`` — a literal ``4.0`` from a ``4.0/4.0``
    line must therefore be converted to ``10.0`` here.

    Rules (first matching pattern wins, in order — tuned for one primary GPA line):
    * ``CGPA … /10`` → numerator as-is.
    * ``CGPA … /4`` → normalize with ``(x/4)*10``.
    * Generic ``X/10`` fraction → ``X``.
    * Generic ``X/4`` fraction → normalized.
    * Bare ``CGPA: Y`` / loose CGPA → ``Y`` on 10-point scale (``Y`` may be < 4 for weak grades).
    * Standalone ``GPA: Y`` (not the ``cgpa`` substring) → if ``Y <= 4.0`` treat as 4-point
      and normalize; if ``Y > 4`` assume already 10-point.
    """
    if not text:
        return None

    # --- Explicit CGPA + denominator (highest priority) ---
    m = re.search(
        r"cgpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\s*/\s*10(?:\.0)?\b",
        text,
        re.IGNORECASE,
    )
    if m:
        v = float(m.group(1))
        if 0.0 <= v <= 10.0:
            return _clamp_cgpa_ten(v)

    m = re.search(
        r"cgpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\s*/\s*4(?:\.0)?\b",
        text,
        re.IGNORECASE,
    )
    if m:
        v = float(m.group(1))
        if 0.0 <= v <= 4.5:
            return _from_four_point_scale(v)

    # --- Generic fractions (e.g. ``7.6/10``, ``3.85/4.0``) ---
    m = re.search(r"(\d{1,2}\.\d{1,2})\s*/\s*10(?:\.0)?\b", text, re.IGNORECASE)
    if m:
        v = float(m.group(1))
        if 0.0 <= v <= 10.0:
            return _clamp_cgpa_ten(v)

    m = re.search(r"(\d{1,2}\.\d{1,2})\s*/\s*4(?:\.0)?\b", text, re.IGNORECASE)
    if m:
        v = float(m.group(1))
        if 0.0 <= v <= 4.5:
            return _from_four_point_scale(v)

    # --- Bare CGPA (Indian-style 10-point; do **not** force /4 normalization) ---
    m = re.search(r"cgpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\b", text, re.IGNORECASE)
    if m:
        v = float(m.group(1))
        if 0.0 <= v <= 10.0:
            return _clamp_cgpa_ten(v)

    m = re.search(r"cgpa[^\n0-9]{0,20}(\d{1,2}\.\d{1,2})\b", text, re.IGNORECASE)
    if m:
        v = float(m.group(1))
        if 0.0 <= v <= 10.0:
            return _clamp_cgpa_ten(v)

    # --- Standalone GPA (US-style label — not ``cgpa``) ---
    m = re.search(r"(?<![a-z])gpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\b", text, re.IGNORECASE)
    if m:
        v = float(m.group(1))
        if 0.0 <= v <= 4.0:
            return _from_four_point_scale(v)
        if 4.0 < v <= 10.0:
            return _clamp_cgpa_ten(v)

    return None


_BRANCH_MAP = {
    "computer science and engineering": "CSE",
    "computer science engineering": "CSE",
    "computer science": "CSE",
    "computer engineering": "CSE",
    "information technology": "IT",
    "electronics and communication engineering": "ECE",
    "electronics and communication": "ECE",
    "electronics communication": "ECE",
    "electronics and telecommunication": "ECE",
    "electrical and electronics engineering": "EEE",
    "electrical engineering": "EEE",
    "mechanical engineering": "MECH",
    "civil engineering": "CIVIL",
    "artificial intelligence and data science": "AIDS",
    "ai and data science": "AIDS",
    "artificial intelligence and machine learning": "AIML",
    "ai and machine learning": "AIML",
}


_DEGREE_PATTERNS = [
    (re.compile(r"\bb\.?\s*tech\b", re.IGNORECASE), "B.Tech"),
    (re.compile(r"\bm\.?\s*tech\b", re.IGNORECASE), "M.Tech"),
    (re.compile(r"\bb\.?\s*e\.?\b", re.IGNORECASE), "B.E."),
    (re.compile(r"\bm\.?\s*e\.?\b", re.IGNORECASE), "M.E."),
    (re.compile(r"\bb\.?\s*sc\.?\b", re.IGNORECASE), "B.Sc."),
    (re.compile(r"\bm\.?\s*sc\.?\b", re.IGNORECASE), "M.Sc."),
    (re.compile(r"\bbachelor\b", re.IGNORECASE), "Bachelor"),
    (re.compile(r"\bmaster\b", re.IGNORECASE), "Master"),
]


# Optional word before "Projects" (e.g. "Technical Projects", "Major Projects").
_PROJECT_PREFIX = (
    r"academic|personal|key|notable|technical|engineering|major|selected|relevant|course"
)

# Standalone: "Projects" / "Technical Projects" on its own line, body starts on
# the next line (common in LaTeX / two-column PDFs).
_PROJECT_HEADER_STANDALONE = re.compile(
    rf"(?:^|\n)\s*(?:{_PROJECT_PREFIX})?\s*projects?\s*[:\-]?\s*\n",
    re.IGNORECASE,
)
# Inline: "Projects: title …" or "Projects – …" on one line (common when
# pdf-parse merges headers with the first bullet). Colon/dash optional so
# "Technical Projects \n• …" still matches.
_PROJECT_HEADER_INLINE = re.compile(
    rf"(?:^|\n)\s*(?:{_PROJECT_PREFIX})?\s*projects?\s*(?:[:\-]\s*([^\n]*))?\n?",
    re.IGNORECASE,
)
# Truncate project body at the next major section (allow "LEADERSHIP & ACTIVITIES" etc. on rest of line).
_NEXT_SECTION = re.compile(
    r"\n\s*(experience|education|skills|certifications?|achievements?|awards?|hobbies|"
    r"interests|publications?|leadership|activities|work\s+history|employment)\b[^\n]*\n",
    re.IGNORECASE,
)
_INTERNSHIP_RE = re.compile(r"\bintern(?:ship)?\b", re.IGNORECASE)
_DURATION_MONTH_RE = re.compile(r"(\d+)\s*(?:month|months|mos)\b", re.IGNORECASE)
_DURATION_YEAR_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:year|years|yrs?)\b", re.IGNORECASE
)


_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}
_DATE_RANGE_RE = re.compile(
    r"(?P<m1>jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z\.]*\s+(?P<y1>\d{4})"
    r"\s*(?:[-–to]+|\bto\b)\s*"
    r"(?:(?P<m2>jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z\.]*\s+(?P<y2>\d{4})|present|current|now)",
    re.IGNORECASE,
)


def _skill_pattern(skill: str) -> re.Pattern:
    """Boundary-aware regex for a single skill phrase.

    `[a-z0-9]` boundaries (instead of `\\b`) so dotted/punctuated tokens like
    `node.js`, `c++`, `c#`, and `ci/cd` aren't broken by punctuation rules.
    """
    return re.compile(
        r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])",
        re.IGNORECASE,
    )


_SKILL_PATTERNS = [(s, _skill_pattern(s)) for s in SKILL_VOCAB]


def _project_has_technical_signal(title: str, description: str, tech: List[str]) -> bool:
    """Keep only projects that show at least one credible technical signal.

    Non-technical lines (e.g. “Apartment Rent Calculator”, “Study Plan”) are dropped
    so the Node scorer’s project *count* heuristic is not inflated.
    """
    if tech:
        return True
    blob = f"{title}\n{description}".lower()
    for _, pattern in _SKILL_PATTERNS:
        if pattern.search(blob):
            return True
    tokens = set(re.findall(r"[a-z0-9\+\#\.]{2,}", blob))
    if tokens & _PROJECT_TECH_TOKEN_SET:
        return True
    for phrase in _PROJECT_TECH_PHRASES:
        if phrase in blob:
            return True
    return False


def _extract_skills(text: str) -> List[str]:
    if not text:
        return []
    found = set()
    for skill, pattern in _SKILL_PATTERNS:
        if pattern.search(text):
            found.add(skill)
    if "node.js" in found and "nodejs" in found:
        found.discard("nodejs")
    return sorted(found)


def _extract_branch(text: str) -> Optional[str]:
    if not text:
        return None
    lowered = text.lower()
    for phrase in sorted(_BRANCH_MAP.keys(), key=len, reverse=True):
        if phrase in lowered:
            return _BRANCH_MAP[phrase]
    for code in ("CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML"):
        if re.search(r"\b" + code + r"\b", text):
            return code
    return None


def _extract_degree(text: str) -> Optional[str]:
    if not text:
        return None
    for pattern, label in _DEGREE_PATTERNS:
        if pattern.search(text):
            return label
    return None


def _months_from_date_range(match: re.Match) -> Optional[int]:
    m1_key = match.group("m1").lower()[:4].rstrip(".")
    if m1_key not in _MONTHS:
        m1_key = m1_key[:3]
    m1 = _MONTHS.get(m1_key)
    if m1 is None:
        return None
    try:
        y1 = int(match.group("y1"))
    except (ValueError, TypeError):
        return None

    if match.group("m2"):
        m2_key = match.group("m2").lower()[:4].rstrip(".")
        if m2_key not in _MONTHS:
            m2_key = m2_key[:3]
        m2 = _MONTHS.get(m2_key)
        try:
            y2 = int(match.group("y2"))
        except (ValueError, TypeError):
            return None
    else:
        now = datetime.utcnow()
        m2 = now.month
        y2 = now.year
    if m2 is None:
        return None

    months = (y2 - y1) * 12 + (m2 - m1)
    if months < 0 or months > 240:
        return None
    return months


def _extract_experience(text: str) -> List[Dict[str, Any]]:
    if not text:
        return []
    items: List[Dict[str, Any]] = []

    for match in _DATE_RANGE_RE.finditer(text):
        months = _months_from_date_range(match)
        if not months:
            continue
        ctx_start = max(0, match.start() - 250)
        ctx_end = min(len(text), match.end() + 250)
        context = text[ctx_start:ctx_end]
        is_internship = bool(_INTERNSHIP_RE.search(context))
        items.append(
            {
                "role": "Internship" if is_internship else "Experience",
                "durationMonths": months,
                "internship": is_internship,
            }
        )

    if items:
        return items

    for m in _DURATION_MONTH_RE.finditer(text):
        try:
            months = int(m.group(1))
        except ValueError:
            continue
        if 0 < months <= 120:
            ctx = text[max(0, m.start() - 200) : m.end() + 50]
            is_internship = bool(_INTERNSHIP_RE.search(ctx))
            items.append(
                {
                    "role": "Internship" if is_internship else "Experience",
                    "durationMonths": months,
                    "internship": is_internship,
                }
            )

    for y in _DURATION_YEAR_RE.finditer(text):
        try:
            years = float(y.group(1))
        except ValueError:
            continue
        if 0 < years <= 10:
            ctx = text[max(0, y.start() - 200) : y.end() + 50]
            is_internship = bool(_INTERNSHIP_RE.search(ctx))
            items.append(
                {
                    "role": "Internship" if is_internship else "Experience",
                    "durationMonths": int(round(years * 12)),
                    "internship": is_internship,
                }
            )

    return items


def _trim_projects_section(section: str) -> str:
    next_match = _NEXT_SECTION.search(section)
    if next_match:
        return section[: next_match.start()]
    return section


def _projects_section_body(text: str) -> Optional[str]:
    """Return raw projects section text (max ~3k chars after header), or None."""
    m_standalone = _PROJECT_HEADER_STANDALONE.search(text)
    if m_standalone:
        start = m_standalone.end()
        return _trim_projects_section(text[start : start + 3000])

    m_inline = _PROJECT_HEADER_INLINE.search(text)
    if m_inline:
        same_line = (m_inline.group(1) or "").strip()
        start = m_inline.end()
        tail = text[start : start + 3000]
        if same_line:
            return _trim_projects_section(same_line + "\n" + tail)
        return _trim_projects_section(tail)

    return None


def _extract_projects(text: str) -> List[Dict[str, Any]]:
    if not text:
        return []

    section = _projects_section_body(text)
    if not section or not section.strip():
        return []

    blocks: List[str] = [b.strip() for b in re.split(r"\n\s*\n", section) if b.strip()]
    if len(blocks) <= 1:
        bullet_split = re.split(r"\n\s*[-*•·●]\s+", section)
        blocks = [b.strip() for b in bullet_split if b.strip()]

    projects: List[Dict[str, Any]] = []
    for block in blocks[:8]:
        first_line, _, rest = block.partition("\n")
        first_line = re.sub(r"^[\s\u2022\u00b7\u25cf\-\*•·●]+", "", first_line.strip())
        if not first_line or len(first_line) < 4:
            continue

        # "Name: description …" on one line → title = name, body = description + following lines.
        if ":" in first_line and first_line.index(":") <= 90:
            title_part, _, desc0 = first_line.partition(":")
            title_part = title_part.strip()
            desc0 = desc0.strip()
            if title_part and len(title_part) <= 120:
                first_line = title_part
                rest = (desc0 + ("\n" + rest if rest else "")).strip()

        block_lower = block.lower()
        tech: List[str] = []
        for skill, pattern in _SKILL_PATTERNS:
            if pattern.search(block_lower):
                tech.append(skill)

        entry = {
            "title": first_line[:120],
            "description": rest.strip()[:300],
            "tech": tech[:8],
        }
        if _project_has_technical_signal(
            entry["title"], entry["description"], entry["tech"]
        ):
            projects.append(entry)

    return projects


def _enhance_with_spacy(profile: Dict[str, Any], text: str) -> Dict[str, Any]:
    """Optional ORG enrichment — leaves baseline output untouched."""
    if _NLP is None or not text:
        return profile
    try:
        doc = _NLP(text[:10000])
        orgs = sorted({ent.text.strip() for ent in doc.ents if ent.label_ == "ORG" and ent.text.strip()})
        if orgs:
            profile["organizations"] = orgs[:10]
    except Exception:
        pass
    return profile


def extract(text: str) -> Dict[str, Any]:
    """Public entry point — returns a profile compatible with `scorer.score`."""
    text = text or ""

    skills = _extract_skills(text)
    cgpa = _extract_cgpa(text)
    branch = _extract_branch(text)
    degree = _extract_degree(text)
    projects = _extract_projects(text)
    experience = _extract_experience(text)

    education: Dict[str, Any] = {}
    if cgpa is not None:
        education["cgpa"] = cgpa
    if branch:
        education["branch"] = branch
    if degree:
        education["degree"] = degree

    profile: Dict[str, Any] = {
        "skills": skills,
        "education": education,
        "projects": projects,
        "experience": experience,
        "extractedTextLength": len(text),
        "extractor": {
            "engine": "regex+spacy" if _NLP is not None else "regex",
            "version": EXTRACTOR_VERSION,
        },
    }

    return _enhance_with_spacy(profile, text)


def extractor_info() -> Dict[str, Any]:
    return {
        "engine": "regex+spacy" if _NLP is not None else "regex",
        "version": EXTRACTOR_VERSION,
        "spacyLoaded": _NLP is not None,
        "skillsVocabSize": len(SKILL_VOCAB),
        "projectTechTokenLexicon": len(_PROJECT_TECH_TOKEN_SET)
        + len(_PROJECT_TECH_PHRASES),
    }

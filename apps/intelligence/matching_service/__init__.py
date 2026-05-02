"""Orbiton matching service.

Composite scoring:  composite = w1*cosine + w2*skill_jaccard
                              + w3*experience_fit + w4*cgpa_fit
Weights are configurable per institution. Mandatory-skill enforcement
(boolean gate) is applied before scoring; failing rows still get a score
returned with boolean_pass=False so the UI can show "near miss" candidates.
"""

MATCHING_VERSION = "1.0.0"

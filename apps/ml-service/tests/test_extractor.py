"""Tests for offline resume text extraction (projects section)."""

import unittest

from extractor import extract


class TestExtractorProjects(unittest.TestCase):
    def test_technical_projects_header_extracts_bullets(self):
        text = """
        John Doe
        SKILLS: Python, Docker, FastAPI

        Technical Projects
        • Alpha: Built an API using FastAPI and Redis.
        • Beta: Supply chain analytics dashboard.

        LEADERSHIP & VOLUNTEERING
        • Ran workshops.
        """
        profile = extract(text)
        titles = [p["title"] for p in profile["projects"]]
        self.assertIn("Alpha", titles)
        self.assertIn("Beta", titles)
        self.assertGreaterEqual(len(profile["projects"]), 2)

    def test_prisma_style_supply_chain_passes_tech_gate(self):
        text = """
        Technical Projects
        • PRISMA: Engineered predictive supply chain intelligence system.
        """
        profile = extract(text)
        self.assertEqual(len(profile["projects"]), 1)
        self.assertEqual(profile["projects"][0]["title"], "PRISMA")


if __name__ == "__main__":
    unittest.main()

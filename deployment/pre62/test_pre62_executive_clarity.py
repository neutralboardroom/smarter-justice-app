import json
import os
import pathlib
import subprocess
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
RUNTIME = pathlib.Path(os.environ.get("RUNTIME", ROOT / ".runtime" / "smarter-justice-v1.7.98"))
RECEIPT = ROOT / "deployment" / "pre62" / "EXECUTIVE_CLARITY__PRE62.json"
METRICS = ROOT / "deployment" / "pre62" / "VISUAL_QA_METRICS__PRE62.json"


class Pre62ExecutiveClarityTests(unittest.TestCase):
    def test_receipt_contract(self):
        receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
        self.assertEqual(receipt["release"], "v2.0.0-pre62")
        self.assertEqual(receipt["marker"], "SMARTER_JUSTICE_PRE62_EXECUTIVE_CLARITY")
        self.assertEqual(receipt["state"], "CANDIDATE_RENDERED_DESIGN_REVIEW_COMPLETE")
        self.assertTrue(receipt["renderedReview"]["actualBrowserRenderingUsed"])
        self.assertTrue(receipt["renderedReview"]["verified"]["mobileMenuOpenAndClosePassed"])
        self.assertTrue(receipt["renderedReview"]["verified"]["externalMicroportalLinksAbsent"])
        self.assertTrue(receipt["preservation"]["noLoss"])
        self.assertFalse(receipt["deploymentContract"]["productionMutationPerformed"])

    def test_visual_evidence(self):
        metrics = json.loads(METRICS.read_text(encoding="utf-8"))
        self.assertEqual(len(metrics["audits"]), 8)
        for audit in metrics["audits"]:
            self.assertEqual(audit["scrollWidth"], audit["clientWidth"])
            self.assertEqual(audit["toggleCount"], 1)
            self.assertEqual(audit["externalMicroportalLinks"], [])
            screenshot = ROOT / "deployment" / "pre62" / "screenshots" / audit["screenshot"]
            self.assertTrue(screenshot.is_file())
            self.assertGreater(screenshot.stat().st_size, 10000)

    def test_runtime_checker(self):
        result = subprocess.run(
            ["node", str(ROOT / "scripts" / "check-pre62-executive-clarity.js")],
            cwd=ROOT,
            env={**os.environ, "RUNTIME": str(RUNTIME)},
            check=True,
            capture_output=True,
            text=True,
        )
        payload = json.loads(result.stdout.strip().splitlines()[-1])
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["preserved"]["legalAreas"], 69)
        self.assertEqual(payload["preserved"]["communityCategories"], 21)
        self.assertEqual(payload["professionalTour"], "step-by-step-default")


if __name__ == "__main__":
    unittest.main()

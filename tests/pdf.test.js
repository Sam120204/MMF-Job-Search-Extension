const test = require("node:test");
const assert = require("node:assert/strict");
const { PDFDocument } = require("pdf-lib");
const jobPdf = require("../src/shared/job-pdf.js");

test("creates a safe, descriptive PDF filename", () => {
  const name = jobPdf.fileName(
    { organization: "RBC / Capital Markets", titleAndRequisition: "Analyst: AI? (R-123456)" },
    new Date("2026-08-24T12:00:00Z")
  );
  assert.equal(name, "RBC Capital Markets - Analyst AI (R-123456) - 2026-08-24.pdf");
});

test("normalizes unsupported typography for standard PDF fonts", () => {
  assert.equal(jobPdf.sanitizeText("You’ll build “models” — fast… • Toronto"), "You'll build \"models\" - fast... - Toronto");
});

test("generates a readable multi-page job-description PDF", async () => {
  const description = Array.from({ length: 180 }, (_, index) => `Responsibility ${index + 1}: analyze markets, document findings, and communicate recommendations.`).join(" ");
  const bytes = await jobPdf.create({
    titleAndRequisition: "Policy AI Applications Intern (R-0000184696)",
    organization: "Royal Bank of Canada",
    deadline: "2026-09-30",
    applicationDate: "2026-08-24",
    sourceUrl: "https://example.com/jobs/R-0000184696",
    description
  }, { capturedAt: new Date("2026-08-24T12:00:00Z") });
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
  const document = await PDFDocument.load(bytes);
  assert.ok(document.getPageCount() >= 3);
  assert.equal(document.getTitle(), "Policy AI Applications Intern (R-0000184696)");
  assert.equal(document.getAuthor(), "Job Sheet");
});

const test = require("node:test");
const assert = require("node:assert/strict");
const schema = require("../src/shared/schema.js");

test("parses Google Sheets URLs and raw spreadsheet IDs", () => {
  assert.equal(schema.parseSpreadsheetId("https://docs.google.com/spreadsheets/d/1juYl618yrAYnmrNUMuPbfo47gsM7uWic/edit?usp=sharing"), "1juYl618yrAYnmrNUMuPbfo47gsM7uWic");
  assert.equal(schema.parseSpreadsheetId("1juYl618yrAYnmrNUMuPbfo47gsM7uWic"), "1juYl618yrAYnmrNUMuPbfo47gsM7uWic");
  assert.equal(schema.parseSpreadsheetId("not a sheet"), null);
});

test("compares the exact seven tracker headers", () => {
  assert.equal(schema.headersMatch(schema.HEADERS), true);
  assert.equal(schema.headersMatch([...schema.HEADERS.slice(0, 6), "Notes"]), false);
  assert.equal(schema.isEmptyHeader([]), true);
});

test("maps an application to the required column order", () => {
  const row = schema.applicationToRow({
    titleAndRequisition: "Analyst (R-123456)", organization: "RBC", deadline: "2026-09-01",
    applicationDate: "2026-08-24", status: "Applied", pdfSaved: "N", nextSteps: "Wait"
  });
  assert.deepEqual(row, ["Analyst (R-123456)", "RBC", "2026-09-01", "2026-08-24", "Applied", "N", "Wait"]);
});

test("finalizes the application date and PDF status when the record is filed", () => {
  const application = schema.applicationForFiling(
    { title: "Analyst", status: "Interested", applicationDate: "2000-01-01", pdfSaved: "N" },
    new Date(2026, 7, 24, 23, 59, 59)
  );
  const row = schema.applicationToRow(application);
  assert.equal(row[3], "2026-08-24");
  assert.equal(row[4], "Interested");
  assert.equal(row[5], "Y");
});

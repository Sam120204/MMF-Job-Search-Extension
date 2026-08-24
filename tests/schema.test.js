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

test("does not claim an application happened when saving an interest", () => {
  const row = schema.applicationToRow({ title: "Analyst", status: "Interested" });
  assert.equal(row[3], "");
  assert.equal(row[4], "Interested");
});

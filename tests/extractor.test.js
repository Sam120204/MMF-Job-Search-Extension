const test = require("node:test");
const assert = require("node:assert/strict");
const extractor = require("../src/shared/extractor.js");

test("finds requisition IDs in labels and Workday-style text", () => {
  assert.equal(extractor.requisitionFromText("Job ID: R-0000184696"), "R-0000184696");
  assert.equal(extractor.requisitionFromText("Requisition number 123456"), "123456");
});

test("normalizes ISO timestamps without timezone drift", () => {
  assert.equal(extractor.normalizeDate("2026-09-30T23:59:00Z"), "2026-09-30");
  assert.equal(extractor.normalizeDate(""), "");
});

test("collects nested JobPosting structured data", () => {
  const job = { "@type": "JobPosting", title: "Policy AI Applications Intern" };
  assert.deepEqual(extractor.collectJobPosting({ "@graph": [{ "@type": "Organization" }, job] }), [job]);
});

test("extracts the supplied Workday-style structured fields", () => {
  const structured = {
    "@type": "JobPosting",
    title: "2027 Winter – GRM, MCCR Policy AI Applications Intern (4 Months)",
    identifier: { "@type": "PropertyValue", value: "R-0000184696" },
    hiringOrganization: { "@type": "Organization", name: "0000050007 Royal Bank of Canada" },
    validThrough: "2026-09-21"
  };
  const documentStub = {
    querySelectorAll(selector) {
      if (selector === 'script[type="application/ld+json"]') return [{ textContent: JSON.stringify(structured) }];
      return [];
    },
    querySelector() { return null; },
    body: { innerText: "" }
  };
  const result = extractor.extract(documentStub, {
    href: "https://rbc.wd3.myworkdayjobs.com/en-US/RBCGLOBAL1/details/example_R-0000184696",
    hostname: "rbc.wd3.myworkdayjobs.com",
    pathname: "/en-US/RBCGLOBAL1/details/example_R-0000184696"
  });
  assert.equal(result.titleAndRequisition, `${structured.title} (R-0000184696)`);
  assert.equal(result.organization, "Royal Bank of Canada");
  assert.equal(result.deadline, "2026-09-21");
  assert.equal(result.detected, true);
});

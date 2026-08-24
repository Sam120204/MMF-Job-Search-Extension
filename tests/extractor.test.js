const test = require("node:test");
const assert = require("node:assert/strict");
const extractor = require("../src/shared/extractor.js");

test("finds requisition IDs in labels and Workday-style text", () => {
  assert.equal(extractor.requisitionFromText("Job ID: R-0000184696"), "R-0000184696");
  assert.equal(extractor.requisitionFromText("Requisition number 123456"), "123456");
  assert.equal(extractor.requisitionFromText("Opening ID: REQ-98765"), "REQ-98765");
  assert.equal(extractor.requisitionFromText("Position code GH_48291"), "GH_48291");
});

test("finds ATS requisitions stored in URL parameters", () => {
  assert.equal(extractor.requisitionFromLocation({ search: "?gh_jid=5813967004" }), "5813967004");
  assert.equal(extractor.requisitionFromLocation({ search: "?requisitionId=REQ-88421" }), "REQ-88421");
});

test("normalizes ISO timestamps without timezone drift", () => {
  assert.equal(extractor.normalizeDate("2026-09-30T23:59:00Z"), "2026-09-30");
  assert.equal(extractor.normalizeDate("Apply by September 21, 2026 (27 days left)"), "2026-09-21");
  assert.equal(extractor.normalizeDate("Closing date: 15 October 2026"), "2026-10-15");
  assert.equal(extractor.normalizeDate(""), "");
});

test("identifies major applicant-tracking platforms", () => {
  assert.equal(extractor.platformFromLocation({ hostname: "boards.greenhouse.io" }), "greenhouse");
  assert.equal(extractor.platformFromLocation({ hostname: "jobs.lever.co" }), "lever");
  assert.equal(extractor.platformFromLocation({ hostname: "jobs.smartrecruiters.com" }), "smartrecruiters");
  assert.equal(extractor.platformFromLocation({ hostname: "jobs.ashbyhq.com" }), "ashby");
  assert.equal(extractor.platformFromLocation({ hostname: "www.linkedin.com" }), "linkedin");
  assert.equal(extractor.platformFromLocation({ hostname: "ca.indeed.com" }), "indeed");
  assert.equal(extractor.platformFromLocation({ hostname: "careers.example.com" }), "generic");
});

test("tolerates malformed URL encoding", () => {
  assert.equal(extractor.safeDecode("bad%path"), "bad%path");
});

test("turns structured HTML descriptions into plain text", () => {
  assert.equal(extractor.stripHtml("<p>Build &amp; ship</p><ul><li>Review results</li></ul>"), "Build & ship Review results");
});

function element(textContent = "", properties = {}) {
  return { textContent, ...properties };
}

function documentFixture({ selectors = {}, body = "", title = "", controls = [], structured = [] }) {
  return {
    title,
    body: { innerText: body },
    querySelector(selector) { return selectors[selector] || null; },
    querySelectorAll(selector) {
      if (selector === 'script[type="application/ld+json"]') return structured;
      if (selector === "button, a, input[type='submit']") return controls;
      return [];
    }
  };
}

test("collects nested JobPosting structured data", () => {
  const job = { "@type": "JobPosting", title: "Policy AI Applications Intern" };
  assert.deepEqual(extractor.collectJobPosting({ "@graph": [{ "@type": "Organization" }, job] }), [job]);
  assert.deepEqual(extractor.collectJobPosting({ mainEntity: job }), [job]);
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

test("extracts a Greenhouse-style page without structured data", () => {
  const doc = documentFixture({
    selectors: {
      ".app-title": element("Senior Data Analyst"),
      ".company-name": element("Northstar Labs"),
      ".job-description": element("Role responsibilities and qualifications")
    },
    body: "Job ID: REQ-98765\nApplication deadline: October 15, 2026\nRole responsibilities and qualifications",
    controls: [element("Apply for this job")]
  });
  const result = extractor.extract(doc, {
    href: "https://boards.greenhouse.io/northstar/jobs/123456",
    hostname: "boards.greenhouse.io",
    pathname: "/northstar/jobs/123456",
    search: ""
  });
  assert.equal(result.titleAndRequisition, "Senior Data Analyst (REQ-98765)");
  assert.equal(result.organization, "Northstar Labs");
  assert.equal(result.deadline, "2026-10-15");
  assert.equal(result.platform, "greenhouse");
  assert.equal(result.extractionMethod, "greenhouse-dom");
  assert.equal(result.confidence, "high");
  assert.equal(result.detected, true);
});

test("matches current Greenhouse production markup and gh_jid", () => {
  const doc = documentFixture({
    selectors: {
      ".job__title h1": element("Distribution Partner Manager"),
      ".job__description": element("Job responsibilities and qualifications")
    },
    title: "Job Application for Distribution Partner Manager at Figma",
    body: "Job responsibilities and qualifications",
    controls: [element("Apply")]
  });
  const result = extractor.extract(doc, {
    href: "https://job-boards.greenhouse.io/figma/jobs/5813967004?gh_jid=5813967004",
    hostname: "job-boards.greenhouse.io",
    pathname: "/figma/jobs/5813967004",
    search: "?gh_jid=5813967004"
  });
  assert.equal(result.titleAndRequisition, "Distribution Partner Manager (5813967004)");
  assert.equal(result.organization, "Figma");
  assert.equal(result.platform, "greenhouse");
  assert.equal(result.detected, true);
});

test("uses path and Apply evidence on Lever-style pages", () => {
  const doc = documentFixture({
    selectors: {
      ".posting-headline h2": element("Machine Learning Intern"),
      ".posting-page .content": element("Position responsibilities and qualifications")
    },
    body: "Position responsibilities and qualifications\nApply by 21 September 2026",
    controls: [element("Apply for this job")]
  });
  const result = extractor.extract(doc, {
    href: "https://jobs.lever.co/acme-ai/abc-123",
    hostname: "jobs.lever.co",
    pathname: "/acme-ai/abc-123",
    search: ""
  });
  assert.equal(result.title, "Machine Learning Intern");
  assert.equal(result.organization, "Acme Ai");
  assert.equal(result.deadline, "2026-09-21");
  assert.equal(result.platform, "lever");
  assert.equal(result.detected, true);
});

test("prefers an organization written in an Ashby-style page title", () => {
  const doc = documentFixture({
    selectors: { "main h1": element("Technical Program Manager"), "main": element("Role responsibilities") },
    title: "Technical Program Manager @ OpenAI",
    body: "Role responsibilities and qualifications",
    controls: [element("Apply")]
  });
  const result = extractor.extract(doc, {
    href: "https://jobs.ashbyhq.com/openai/8fb1615c-34bf-47c4-a1d1-b7b2f836bbd3",
    hostname: "jobs.ashbyhq.com",
    pathname: "/openai/8fb1615c-34bf-47c4-a1d1-b7b2f836bbd3",
    search: ""
  });
  assert.equal(result.organization, "OpenAI");
  assert.equal(result.platform, "ashby");
  assert.equal(result.detected, true);
});

test("extracts a plain employer career page through generic DOM evidence", () => {
  const doc = documentFixture({
    selectors: {
      "main h1": element("Policy Research Associate"),
      "main": element("Job responsibilities and required qualifications"),
      'meta[property="og:site_name"]': element("", { content: "Civic Capital" })
    },
    body: "Requisition ID: CC-20481\nClosing date: November 7, 2026\nJob responsibilities and required qualifications",
    controls: [element("Apply now")]
  });
  const result = extractor.extract(doc, {
    href: "https://careers.civiccapital.ca/openings/policy-research-associate",
    hostname: "careers.civiccapital.ca",
    pathname: "/openings/policy-research-associate",
    search: ""
  });
  assert.equal(result.titleAndRequisition, "Policy Research Associate (CC-20481)");
  assert.equal(result.organization, "Civic Capital");
  assert.equal(result.deadline, "2026-11-07");
  assert.equal(result.platform, "generic");
  assert.equal(result.detected, true);
});

test("extracts LinkedIn toolbar fields without using LinkedIn as the employer", () => {
  const doc = documentFixture({
    selectors: {
      ".job-details-jobs-unified-top-card__job-title h1": element("Quantitative Analyst Intern"),
      ".job-details-jobs-unified-top-card__company-name a": element("Maple Markets"),
      "#job-details": element("Role responsibilities and qualifications"),
      'meta[property="og:site_name"]': element("", { content: "LinkedIn" })
    },
    body: "Job ID: MM-48291\nRole responsibilities and qualifications",
    controls: [element("Apply")]
  });
  const result = extractor.extract(doc, {
    href: "https://www.linkedin.com/jobs/view/482910001",
    hostname: "www.linkedin.com",
    pathname: "/jobs/view/482910001",
    search: ""
  });
  assert.equal(result.titleAndRequisition, "Quantitative Analyst Intern (MM-48291)");
  assert.equal(result.organization, "Maple Markets");
  assert.equal(result.platform, "linkedin");
  assert.equal(result.detected, true);
});

test("does not treat a job-search listing as a job detail", () => {
  const doc = documentFixture({
    selectors: { "main h1": element("Search jobs"), "main": element("Browse open positions") },
    body: "Browse open positions",
    controls: [element("Search")]
  });
  const result = extractor.extract(doc, {
    href: "https://jobs.example.com/jobs",
    hostname: "jobs.example.com",
    pathname: "/jobs",
    search: ""
  });
  assert.equal(result.detected, false);
});

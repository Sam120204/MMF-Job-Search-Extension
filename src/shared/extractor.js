(function exposeExtractor(root) {
  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function collectJobPosting(value, output = []) {
    if (!value) return output;
    if (Array.isArray(value)) {
      value.forEach((item) => collectJobPosting(item, output));
      return output;
    }
    if (typeof value !== "object") return output;
    const type = value["@type"];
    if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) output.push(value);
    if (value["@graph"]) collectJobPosting(value["@graph"], output);
    return output;
  }

  function getStructuredJob(doc) {
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const jobs = collectJobPosting(JSON.parse(script.textContent));
        if (jobs.length) return jobs[0];
      } catch (_error) {
        // Continue with DOM fallbacks when unrelated structured data is malformed.
      }
    }
    return {};
  }

  function meta(doc, ...selectors) {
    for (const selector of selectors) {
      const value = doc.querySelector(selector)?.content;
      if (clean(value)) return clean(value);
    }
    return "";
  }

  function textFrom(doc, selectors) {
    for (const selector of selectors) {
      const value = clean(doc.querySelector(selector)?.textContent);
      if (value) return value;
    }
    return "";
  }

  function identifierValue(identifier) {
    if (!identifier) return "";
    if (typeof identifier === "string") return clean(identifier);
    return clean(identifier.value || identifier.name);
  }

  function requisitionFromText(text) {
    const source = clean(text);
    const labelled = source.match(/(?:job|requisition|req(?:uisition)?)\s*(?:id|number|#|no\.?|code)?\s*[:#-]?\s*([A-Z]{0,4}-?\d{4,})/i);
    if (labelled) return labelled[1].toUpperCase();
    const generic = source.match(/\bR-\d{6,}\b/i);
    return generic ? generic[0].toUpperCase() : "";
  }

  function normalizeDate(value) {
    const input = clean(value);
    if (!input) return "";
    const iso = input.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
    const parsed = new Date(input);
    if (Number.isNaN(parsed.valueOf())) return input;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }

  function deadlineFromBody(doc) {
    const body = clean(doc.body?.innerText).slice(0, 100000);
    const match = body.match(/(?:application\s+deadline|apply\s+by|closing\s+date|deadline)\s*:?\s*([^\n|•]{4,40})/i);
    return match ? normalizeDate(match[1]) : "";
  }

  function organizationName(job, doc, locationLike) {
    const organization = job.hiringOrganization;
    if (typeof organization === "string") return clean(organization).replace(/^\d{6,}\s+/, "");
    if (clean(organization?.name)) return clean(organization.name).replace(/^\d{6,}\s+/, "");
    const siteName = meta(doc, 'meta[property="og:site_name"]', 'meta[name="application-name"]');
    if (siteName && !/workday/i.test(siteName)) return siteName;
    const tenant = String(locationLike?.hostname || "").split(".")[0];
    return tenant && !/^wd\d+$/i.test(tenant) ? tenant.replaceAll("-", " ").toUpperCase() : "";
  }

  function extract(doc = document, locationLike = location) {
    const job = getStructuredJob(doc);
    const title = clean(
      job.title ||
      textFrom(doc, ["h1[data-automation-id='jobPostingHeader']", "h1", "[data-automation-id='jobTitle']"]) ||
      meta(doc, 'meta[property="og:title"]')
    ).replace(/\s*[|–-]\s*(?:careers?|jobs?).*$/i, "");
    const identifier = identifierValue(job.identifier);
    const urlText = decodeURIComponent(String(locationLike?.pathname || ""));
    const visibleText = clean(doc.body?.innerText).slice(0, 50000);
    const requisition = identifier || requisitionFromText(urlText) || requisitionFromText(visibleText);
    const organization = organizationName(job, doc, locationLike);
    const deadline = normalizeDate(job.validThrough) || deadlineFromBody(doc);
    const description = clean(job.description || textFrom(doc, ["[data-automation-id='jobPostingDescription']", "main"]));
    return {
      title,
      requisition,
      titleAndRequisition: requisition && !title.toLowerCase().includes(requisition.toLowerCase()) ? `${title} (${requisition})` : title,
      organization,
      deadline,
      sourceUrl: String(locationLike?.href || ""),
      description,
      detected: Boolean(title && (job.title || /\/(?:job|details)\//i.test(urlText)))
    };
  }

  const api = { clean, collectJobPosting, requisitionFromText, normalizeDate, extract };
  root.JobSheetExtractor = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

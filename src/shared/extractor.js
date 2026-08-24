(function exposeExtractor(root) {
  const SELECTORS = Object.freeze({
    title: [
      "[data-automation-id='jobPostingHeader']", "[data-testid='job-title']", "[data-qa='job-title']",
      ".job-details-jobs-unified-top-card__job-title h1", ".jobsearch-JobInfoHeader-title",
      "[itemprop='title']", ".posting-headline h2", ".job__title h1", ".job-title h1",
      ".app-title", "main h1", "h1"
    ],
    organization: [
      "[itemprop='hiringOrganization'] [itemprop='name']", "[itemprop='hiringOrganization']",
      "[data-testid='company-name']", "[data-qa='job-company']", ".posting-headline .company",
      ".job-details-jobs-unified-top-card__company-name a", ".jobsearch-InlineCompanyRating div",
      ".company-name", ".job-company"
    ],
    description: [
      "[data-automation-id='jobPostingDescription']", "[data-testid='job-description']",
      "[itemprop='description']", "#job-details", "#jobDescriptionText", ".job__description",
      ".job-description", ".posting-page .content", "#job-description", "main"
    ],
    deadline: [
      "[itemprop='validThrough']", "[data-testid='job-deadline']", "[data-qa='job-deadline']",
      ".application-deadline", ".closing-date"
    ]
  });

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(String(value || ""));
    } catch (_error) {
      return String(value || "");
    }
  }

  function stripHtml(value) {
    return clean(String(value || "")
      .replace(/<\s*br\s*\/?\s*>/gi, " ")
      .replace(/<\/(?:p|div|li|h\d)>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'"));
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
    Object.values(value).forEach((child) => {
      if (child && typeof child === "object") collectJobPosting(child, output);
    });
    return output;
  }

  function getStructuredJob(doc) {
    for (const script of doc.querySelectorAll?.('script[type="application/ld+json"]') || []) {
      try {
        const jobs = collectJobPosting(JSON.parse(script.textContent));
        if (jobs.length) return jobs[0];
      } catch (_error) {
        // Continue with platform and generic DOM fallbacks.
      }
    }
    return {};
  }

  function meta(doc, ...selectors) {
    for (const selector of selectors) {
      const value = doc.querySelector?.(selector)?.content;
      if (clean(value)) return clean(value);
    }
    return "";
  }

  function textFrom(doc, selectors) {
    for (const selector of selectors) {
      const value = clean(doc.querySelector?.(selector)?.textContent);
      if (value) return value;
    }
    return "";
  }

  function valueFrom(doc, selectors) {
    for (const selector of selectors) {
      const element = doc.querySelector?.(selector);
      const value = clean(element?.content || element?.dateTime || element?.getAttribute?.("datetime") || element?.textContent);
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
    const labelled = source.match(/(?:job|requisition|req(?:uisition)?|opening|position)\s*(?:id|number|#|no\.?|code)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9_-]{3,})/i);
    if (labelled && /\d/.test(labelled[1])) return labelled[1].toUpperCase();
    const generic = source.match(/\b(?:R|REQ|JR|JOB)-?\d{5,}\b/i);
    return generic ? generic[0].toUpperCase() : "";
  }

  function requisitionFromLocation(locationLike) {
    const search = String(locationLike?.search || "").replace(/^\?/, "");
    const parameters = new URLSearchParams(search);
    for (const key of ["gh_jid", "jobId", "job_id", "requisitionId", "requisition_id"]) {
      const value = clean(parameters.get(key));
      if (value && /\d/.test(value) && /^[A-Z0-9_-]{4,}$/i.test(value)) return value.toUpperCase();
    }
    return "";
  }

  function normalizeDate(value) {
    const input = clean(value);
    if (!input) return "";
    const iso = input.match(/(\d{4}-\d{2}-\d{2})(?:T|\b)/);
    if (iso) return iso[1];
    const dateText = input.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/i)?.[0]
      || input.match(/\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/i)?.[0]
      || input.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)?.[0];
    if (!dateText) return "";
    const parsed = new Date(dateText.replace(/(\d)(st|nd|rd|th)\b/i, "$1"));
    if (Number.isNaN(parsed.valueOf())) return "";
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }

  function deadlineFromBody(doc) {
    const body = String(doc.body?.innerText || "").slice(0, 150000);
    const match = body.match(/(?:application\s+(?:deadline|closes?)|apply\s+by|closing\s+date|last\s+date\s+to\s+apply|deadline|end\s+date)\s*:?\s*([^\n|•]{4,80})/i);
    return match ? normalizeDate(match[1]) : "";
  }

  function platformFromLocation(locationLike) {
    const hostname = String(locationLike?.hostname || "").toLowerCase();
    if (hostname.endsWith("myworkdayjobs.com") || hostname.endsWith("workday.com")) return "workday";
    if (hostname.endsWith("greenhouse.io")) return "greenhouse";
    if (hostname.endsWith("lever.co")) return "lever";
    if (hostname.endsWith("smartrecruiters.com")) return "smartrecruiters";
    if (hostname.endsWith("ashbyhq.com")) return "ashby";
    if (hostname.includes("icims.com")) return "icims";
    if (hostname.endsWith("taleo.net")) return "taleo";
    if (hostname.includes("successfactors.com")) return "successfactors";
    if (hostname.endsWith("linkedin.com")) return "linkedin";
    if (hostname.includes("indeed.com")) return "indeed";
    if (hostname.includes("glassdoor.")) return "glassdoor";
    if (hostname.endsWith("ziprecruiter.com")) return "ziprecruiter";
    return "generic";
  }

  function titleCaseSlug(value) {
    return clean(safeDecode(value).replace(/[-_]+/g, " "))
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function companyFromPath(locationLike, platform) {
    const parts = String(locationLike?.pathname || "").split("/").filter(Boolean);
    if (["lever", "ashby", "smartrecruiters"].includes(platform)) return titleCaseSlug(parts[0]);
    if (platform === "greenhouse") {
      const jobsIndex = parts.findIndex((part) => part.toLowerCase() === "jobs");
      return jobsIndex > 0 ? titleCaseSlug(parts[jobsIndex - 1]) : titleCaseSlug(parts[0]);
    }
    return "";
  }

  function organizationName(job, doc, locationLike, platform, title) {
    const organization = job.hiringOrganization;
    if (typeof organization === "string") return clean(organization).replace(/^\d{6,}\s+/, "");
    if (clean(organization?.name)) return clean(organization.name).replace(/^\d{6,}\s+/, "");
    const selected = textFrom(doc, SELECTORS.organization);
    if (selected) return selected.replace(/^\d{6,}\s+/, "");
    const siteName = meta(doc, 'meta[property="og:site_name"]', 'meta[name="application-name"]');
    if (siteName && !/(workday|greenhouse|lever|smartrecruiters|ashby|icims|taleo|linkedin|indeed|glassdoor|ziprecruiter)/i.test(siteName)) return siteName;
    const pageTitle = clean(doc.title || meta(doc, 'meta[property="og:title"]', 'meta[name="twitter:title"]'));
    const atCompany = pageTitle.match(/\s+(?:at|@)\s+(.+?)(?:\s*[|–-]\s*(?:careers?|jobs?))?$/i);
    if (atCompany) return clean(atCompany[1]);
    if (title && pageTitle.toLowerCase().startsWith(title.toLowerCase())) {
      const remainder = clean(pageTitle.slice(title.length).replace(/^[|–-]+/, ""))
        .replace(/\s*[|–-]?\s*(?:careers?|jobs?)$/i, "");
      if (remainder && !/^(careers?|jobs?)$/i.test(remainder)) return remainder;
    }
    const fromPath = companyFromPath(locationLike, platform);
    if (fromPath) return fromPath;
    const tenant = String(locationLike?.hostname || "").split(".")[0];
    return tenant && !/^(www|jobs?|careers?|boards?|wd\d+)$/i.test(tenant) ? titleCaseSlug(tenant) : "";
  }

  function cleanTitle(value) {
    return clean(value)
      .replace(/^job\s+application\s+for\s+/i, "")
      .replace(/^job\s+(?:opening|posting)\s*[:|-]\s*/i, "")
      .replace(/\s*[|–-]\s*(?:careers?|jobs?|apply now)\s*$/i, "");
  }

  function interactiveText(doc) {
    return Array.from(doc.querySelectorAll?.("button, a, input[type='submit']") || [])
      .map((element) => clean(element.textContent || element.value))
      .join(" ");
  }

  function isGenericTitle(title) {
    return !title || /^(careers?|jobs?|job search|search (?:for )?jobs?|open positions?|opportunities|join (?:us|our team))$/i.test(clean(title));
  }

  function hasDetailPath(locationLike, platform) {
    const path = safeDecode(locationLike?.pathname);
    const parts = path.split("/").filter(Boolean);
    if (/\/(?:job|jobs|details|positions?|openings?|requisitions?)\//i.test(path) || /\/viewjob\b/i.test(path)) return true;
    if (platform === "lever") return parts.length >= 2;
    if (["ashby", "smartrecruiters"].includes(platform)) return parts.length >= 2;
    return /(?:jobid|job_id|gh_jid|requisitionId)=/i.test(String(locationLike?.search || ""));
  }

  function extractionConfidence({ structured, title, requisition, hasApply, hasDescription, detailPath }) {
    if (structured || (title && requisition)) return "high";
    if (title && ((hasApply && hasDescription) || detailPath)) return "medium";
    return "low";
  }

  function extract(doc = document, locationLike = location) {
    const job = getStructuredJob(doc);
    const platform = platformFromLocation(locationLike);
    const title = cleanTitle(job.title || textFrom(doc, SELECTORS.title)
      || meta(doc, 'meta[property="og:title"]', 'meta[name="twitter:title"]') || doc.title);
    const urlText = safeDecode(`${locationLike?.pathname || ""} ${locationLike?.search || ""}`);
    const visibleText = String(doc.body?.innerText || "").slice(0, 150000);
    const requisition = identifierValue(job.identifier) || requisitionFromLocation(locationLike)
      || requisitionFromText(urlText) || requisitionFromText(visibleText);
    const organization = organizationName(job, doc, locationLike, platform, title);
    const deadline = normalizeDate(job.validThrough) || normalizeDate(valueFrom(doc, SELECTORS.deadline)) || deadlineFromBody(doc);
    const description = stripHtml(job.description || textFrom(doc, SELECTORS.description));
    const controls = interactiveText(doc);
    const hasApply = /\b(?:apply|submit application|apply for this job)\b/i.test(controls);
    const hasDescription = Boolean(job.description || textFrom(doc, SELECTORS.description))
      && /(?:job|position|role|responsibilit|qualification|about the opportunity|what you(?:'|’)ll do)/i.test(visibleText);
    const detailPath = hasDetailPath(locationLike, platform);
    const structured = Boolean(job.title);
    const detected = !isGenericTitle(title) && Boolean(structured || requisition || (hasApply && hasDescription) || detailPath);
    const confidence = extractionConfidence({ structured, title, requisition, hasApply, hasDescription, detailPath });

    return {
      title,
      requisition,
      titleAndRequisition: requisition && !title.toLowerCase().includes(requisition.toLowerCase()) ? `${title} (${requisition})` : title,
      organization,
      deadline,
      sourceUrl: String(locationLike?.href || ""),
      description,
      platform,
      extractionMethod: structured ? "structured-data" : platform === "generic" ? "generic-dom" : `${platform}-dom`,
      confidence,
      detected
    };
  }

  const api = {
    SELECTORS, clean, safeDecode, stripHtml, collectJobPosting, requisitionFromText, requisitionFromLocation, normalizeDate,
    platformFromLocation, companyFromPath, isGenericTitle, hasDetailPath, extract
  };
  root.JobSheetExtractor = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

(function exposeSchema(root) {
  const HEADERS = Object.freeze([
    "Job Title with Requisition #",
    "Organization",
    "Application deadline",
    "Date of application",
    "Current Status",
    "PDF of JD saved? Y/N",
    "Outcomes/Responses/Next steps"
  ]);

  const STATUSES = Object.freeze(["Interested", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"]);

  function parseSpreadsheetId(value) {
    const input = String(value || "").trim();
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) return urlMatch[1];
    if (/^[a-zA-Z0-9-_]{20,}$/.test(input)) return input;
    return null;
  }

  function todayLocal(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function quoteSheetTitle(title) {
    return `'${String(title).replaceAll("'", "''")}'`;
  }

  function headersMatch(values) {
    return HEADERS.every((header, index) => String(values[index] || "").trim() === header);
  }

  function isEmptyHeader(values) {
    return !values.some((value) => String(value || "").trim());
  }

  function applicationToRow(application) {
    return [
      application.titleAndRequisition || application.title || "",
      application.organization || "",
      application.deadline || "",
      application.applicationDate || "",
      application.status || "Interested",
      application.pdfSaved || "N",
      application.nextSteps || ""
    ];
  }

  const api = { HEADERS, STATUSES, parseSpreadsheetId, todayLocal, quoteSheetTitle, headersMatch, isEmptyHeader, applicationToRow };
  root.JobSheetSchema = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

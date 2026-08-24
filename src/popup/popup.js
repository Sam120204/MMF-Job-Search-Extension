import { icons, sendMessage, setBusy, announce } from "../shared/ui.js";

const states = ["loading-state", "setup-state", "unsupported-state", "capture-state", "success-state"];
const byId = (id) => document.getElementById(id);
let extractedJob = null;
let settings = null;

function showState(id) {
  states.forEach((stateId) => { byId(stateId).hidden = stateId !== id; });
}

function openOptions() { chrome.runtime.openOptionsPage(); }

async function extractActivePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/i.test(tab.url || "")) return null;
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["src/shared/extractor.js"] });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => globalThis.JobSheetExtractor?.extract(document, location) || null
  });
  return result;
}

function populateForm(job) {
  byId("job-title").value = job.titleAndRequisition || job.title || "";
  byId("organization").value = job.organization || "";
  byId("deadline").value = /^\d{4}-\d{2}-\d{2}$/.test(job.deadline || "") ? job.deadline : "";
  byId("application-date").value = "";
  byId("status").value = "Interested";
  byId("pdf-saved").value = "N";
  byId("next-steps").value = "";
  byId("destination-name").textContent = `${settings.spreadsheetName || "Google Sheet"} / ${settings.sheetTitle}`;
}

function formApplication() {
  return { ...Object.fromEntries(new FormData(byId("capture-form"))), sourceUrl: extractedJob.sourceUrl, description: extractedJob.description };
}

async function load() {
  showState("loading-state");
  byId("form-notice").hidden = true;
  try {
    settings = await chrome.storage.sync.get(["spreadsheetId", "spreadsheetName", "sheetId", "sheetTitle"]);
    if (!settings.spreadsheetId || !settings.sheetTitle || settings.sheetId === undefined) {
      showState("setup-state");
      return;
    }
    extractedJob = await extractActivePage();
    if (!extractedJob?.detected) {
      showState("unsupported-state");
      return;
    }
    populateForm(extractedJob);
    showState("capture-state");
  } catch (error) {
    showState("unsupported-state");
    byId("unsupported-state").querySelector("p").textContent = error.message;
  }
}

byId("settings-button").innerHTML = icons.settings;
byId("success-icon").innerHTML = icons.check;
byId("settings-button").addEventListener("click", openOptions);
byId("setup-button").addEventListener("click", openOptions);
byId("change-destination").addEventListener("click", openOptions);
byId("retry-button").addEventListener("click", load);
byId("capture-another").addEventListener("click", load);
JobSheetSchema.STATUSES.forEach((status) => byId("status").add(new Option(status, status)));
byId("status").addEventListener("change", (event) => {
  const dateInput = byId("application-date");
  if (event.target.value === "Interested") dateInput.value = "";
  else if (!dateInput.value) dateInput.value = JobSheetSchema.todayLocal();
});

byId("capture-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = byId("save-button");
  setBusy(button, true, "Filing application…");
  announce(byId("form-notice"), "Connecting to Google Sheets…");
  try {
    const result = await sendMessage({
      type: "APPEND_APPLICATION",
      spreadsheetId: settings.spreadsheetId,
      sheetId: settings.sheetId,
      sheetTitle: settings.sheetTitle,
      application: formApplication()
    });
    byId("success-copy").textContent = result.rowNumber ? `Added to row ${result.rowNumber} in ${settings.sheetTitle}.` : `Added to ${settings.sheetTitle}.`;
    byId("open-sheet-link").href = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`;
    showState("success-state");
  } catch (error) {
    announce(byId("form-notice"), error.message, "error");
  } finally {
    setBusy(button, false, "File in Google Sheet");
  }
});

const previewState = location.hostname === "localhost" && new URLSearchParams(location.search).get("preview");
if (previewState === "capture") {
  settings = { spreadsheetName: "Application Tracker", sheetTitle: "2027 Internships" };
  extractedJob = {
    title: "Policy AI Applications Intern",
    titleAndRequisition: "Policy AI Applications Intern (R-0000184696)",
    organization: "Royal Bank of Canada",
    deadline: "2026-09-30",
    sourceUrl: "https://example.com/job/R-0000184696",
    description: "Preview record"
  };
  populateForm(extractedJob);
  showState("capture-state");
} else {
  load();
}

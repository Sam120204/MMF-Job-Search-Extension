import { sendMessage, setBusy, announce } from "../shared/ui.js";

const byId = (id) => document.getElementById(id);
let activeSpreadsheet = null;
let spreadsheetId = null;

function saveDestination(sheet) {
  return chrome.storage.sync.set({
    spreadsheetId,
    spreadsheetName: activeSpreadsheet.properties.title,
    sheetId: sheet.sheetId,
    sheetTitle: sheet.title
  });
}

async function prepareAndSaveTab(sheet) {
  const result = await sendMessage({ type: "PREPARE_SHEET", spreadsheetId, sheetId: sheet.sheetId, sheetTitle: sheet.title });
  await saveDestination(sheet);
  await renderCurrent();
  return result;
}

async function useTab(sheet, button) {
  setBusy(button, true, "Checking…");
  announce(byId("setup-notice"), `Checking ${sheet.title}…`);
  try {
    const result = await prepareAndSaveTab(sheet);
    announce(byId("setup-notice"), result.initialized ? `${sheet.title} was prepared and selected.` : `${sheet.title} is connected and ready.`, "success");
  } catch (error) {
    announce(byId("setup-notice"), error.message, "error");
  } finally {
    setBusy(button, false, "Use this tab");
  }
}

function renderTabs() {
  byId("spreadsheet-title").textContent = activeSpreadsheet.properties.title;
  const list = byId("tabs-list");
  list.replaceChildren();
  activeSpreadsheet.sheets.sort((a, b) => a.properties.index - b.properties.index).forEach((entry, index) => {
    const sheet = entry.properties;
    const row = document.createElement("div");
    row.className = "tab-row";
    row.innerHTML = `<span class="tab-index">${String(index + 1).padStart(2, "0")}</span><span class="tab-title"></span>`;
    row.querySelector(".tab-title").textContent = sheet.title;
    const button = document.createElement("button");
    button.className = "secondary-button";
    button.type = "button";
    button.innerHTML = "<span>Use this tab</span>";
    button.addEventListener("click", () => useTab(sheet, button));
    row.append(button);
    list.append(row);
  });
  byId("tabs-section").hidden = false;
}

async function inspectSpreadsheet({ autoSelectFirst = false } = {}) {
  activeSpreadsheet = await sendMessage({ type: "GET_SPREADSHEET", spreadsheetId, interactive: true });
  activeSpreadsheet.sheets.sort((a, b) => a.properties.index - b.properties.index);
  if (autoSelectFirst && activeSpreadsheet.sheets.length) {
    const firstSheet = activeSpreadsheet.sheets[0].properties;
    try {
      const result = await prepareAndSaveTab(firstSheet);
      byId("tabs-section").hidden = true;
      return { selected: true, sheet: firstSheet, initialized: result.initialized };
    } catch (error) {
      if (error.code !== "HEADER_MISMATCH") throw error;
    }
  }
  renderTabs();
  return { selected: false };
}

async function renderCurrent() {
  const current = await chrome.storage.sync.get(["spreadsheetId", "spreadsheetName", "sheetTitle"]);
  if (!current.spreadsheetId || !current.sheetTitle) return;
  byId("current-destination").textContent = `${current.spreadsheetName || "Google Sheet"} / ${current.sheetTitle}`;
  byId("open-current").href = `https://docs.google.com/spreadsheets/d/${current.spreadsheetId}/edit`;
  byId("spreadsheet-url").value = `https://docs.google.com/spreadsheets/d/${current.spreadsheetId}/edit`;
  byId("current-section").hidden = false;
}

JobSheetSchema.HEADERS.forEach((header) => {
  const item = document.createElement("li");
  item.textContent = header;
  byId("headers-list").append(item);
});

byId("link-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = byId("inspect-button");
  spreadsheetId = JobSheetSchema.parseSpreadsheetId(byId("spreadsheet-url").value);
  if (!spreadsheetId) {
    announce(byId("setup-notice"), "Paste a complete Google Sheets link ending in /spreadsheets/d/…/edit.", "error");
    return;
  }
  setBusy(button, true, "Connecting…");
  announce(byId("setup-notice"), "Waiting for Google sign-in…");
  try {
    const result = await inspectSpreadsheet({ autoSelectFirst: true });
    if (result.selected) {
      const action = result.initialized ? "was prepared and selected" : "is connected and ready";
      announce(byId("setup-notice"), `${result.sheet.title} ${action}.`, "success");
    } else {
      announce(byId("setup-notice"), "The first worksheet contains different columns. Choose another tab or create a prepared tracker tab.", "neutral");
    }
  } catch (error) {
    const officeHint = /not found|requested entity/i.test(error.message) ? " If this is an Excel file stored in Drive, open it in Google Sheets and choose File → Save as Google Sheets first." : "";
    announce(byId("setup-notice"), `${error.message}${officeHint}`, "error");
  } finally {
    setBusy(button, false, "Connect and inspect");
  }
});

byId("create-tab-button").addEventListener("click", async () => {
  const button = byId("create-tab-button");
  setBusy(button, true, "Creating…");
  try {
    const sheet = await sendMessage({ type: "CREATE_TRACKER_SHEET", spreadsheetId });
    await saveDestination(sheet);
    announce(byId("setup-notice"), `${sheet.title} was created and selected.`, "success");
    await inspectSpreadsheet();
    await renderCurrent();
  } catch (error) {
    announce(byId("setup-notice"), error.message, "error");
  } finally {
    setBusy(button, false, "Create a new “Job Tracker” tab");
  }
});

byId("sign-out-button").addEventListener("click", async () => {
  try {
    await sendMessage({ type: "SIGN_OUT" });
    announce(byId("setup-notice"), "Signed out of Google. Your spreadsheet destination is still saved.", "success");
  } catch (error) {
    announce(byId("setup-notice"), error.message, "error");
  }
});

const config = await sendMessage({ type: "CONFIG_STATUS" });
if (!config.oauthConfigured) {
  byId("oauth-warning").textContent = "Developer setup required: replace the OAuth client ID in manifest.json before connecting Google Sheets.";
  byId("oauth-warning").hidden = false;
}
await renderCurrent();

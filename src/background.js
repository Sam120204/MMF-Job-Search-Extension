importScripts("vendor/pdf-lib.min.js", "shared/schema.js", "shared/job-pdf.js");

const SHEETS_API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";
const GOOGLE_API_ROOT = "https://www.googleapis.com";
const PDF_FOLDER_NAME = "Job Sheet PDFs";

function extensionConfigured() {
  const clientId = chrome.runtime.getManifest().oauth2?.client_id || "";
  return Boolean(clientId && !clientId.startsWith("REPLACE_WITH_"));
}

function getAuthToken(interactive) {
  if (!extensionConfigured()) {
    throw new Error("Google OAuth is not configured yet. Add the OAuth client ID to manifest.json, then reload the extension.");
  }
  return chrome.identity.getAuthToken({ interactive }).then(({ token }) => token);
}

async function clearToken(token) {
  if (token) await chrome.identity.removeCachedAuthToken({ token });
}

async function authorizedRequest(url, options = {}, interactive = true, retry = true, serviceName = "Google") {
  const token = await getAuthToken(interactive);
  const bodyIsFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.body && !bodyIsFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(url, {
    ...options,
    headers
  });
  if (response.status === 401 && retry) {
    await clearToken(token);
    return authorizedRequest(url, options, interactive, false, serviceName);
  }
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch (_error) {
    body = text ? { message: text } : {};
  }
  if (!response.ok) {
    const error = new Error(body.error?.message || body.message || `${serviceName} returned ${response.status}.`);
    error.code = body.error?.status || `HTTP_${response.status}`;
    throw error;
  }
  return body;
}

function apiRequest(path, options = {}, interactive = true, retry = true) {
  return authorizedRequest(`${SHEETS_API_ROOT}${path}`, options, interactive, retry, "Google Sheets");
}

function driveApiRequest(path, options = {}, interactive = true, retry = true) {
  return authorizedRequest(`${GOOGLE_API_ROOT}${path}`, options, interactive, retry, "Google Drive");
}

async function getSpreadsheet(spreadsheetId, interactive = true) {
  return apiRequest(
    `/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties(sheetId,title,index,gridProperties)`,
    {},
    interactive
  );
}

async function getHeader(spreadsheetId, sheetTitle, interactive = true) {
  const range = encodeURIComponent(`${JobSheetSchema.quoteSheetTitle(sheetTitle)}!1:1`);
  const result = await apiRequest(`/${encodeURIComponent(spreadsheetId)}/values/${range}`, {}, interactive);
  return result.values?.[0] || [];
}

async function writeHeaders(spreadsheetId, sheetTitle) {
  const range = encodeURIComponent(`${JobSheetSchema.quoteSheetTitle(sheetTitle)}!A1:G1`);
  await apiRequest(`/${encodeURIComponent(spreadsheetId)}/values/${range}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [JobSheetSchema.HEADERS] })
  });
}

async function formatTrackerSheet(spreadsheetId, sheetId) {
  return apiRequest(`/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 7 },
            cell: {
              userEnteredFormat: {
                backgroundColorStyle: { rgbColor: { red: 0.08, green: 0.22, blue: 0.17 } },
                textFormat: { foregroundColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } }, bold: true },
                wrapStrategy: "WRAP",
                verticalAlignment: "MIDDLE"
              }
            },
            fields: "userEnteredFormat(backgroundColorStyle,textFormat,wrapStrategy,verticalAlignment)"
          }
        },
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 7 },
            properties: { pixelSize: 180 },
            fields: "pixelSize"
          }
        }
      ]
    })
  });
}

async function prepareSheet(spreadsheetId, sheetId, sheetTitle) {
  const values = await getHeader(spreadsheetId, sheetTitle);
  if (JobSheetSchema.isEmptyHeader(values)) {
    await writeHeaders(spreadsheetId, sheetTitle);
    await formatTrackerSheet(spreadsheetId, sheetId);
    return { initialized: true };
  }
  if (!JobSheetSchema.headersMatch(values)) {
    const error = new Error("This tab already contains different columns. Choose another tab or create a new Job Tracker tab.");
    error.code = "HEADER_MISMATCH";
    throw error;
  }
  return { initialized: false };
}

async function createTrackerSheet(spreadsheetId) {
  const spreadsheet = await getSpreadsheet(spreadsheetId);
  const existing = new Set(spreadsheet.sheets.map((sheet) => sheet.properties.title));
  let title = "Job Tracker";
  let suffix = 2;
  while (existing.has(title)) title = `Job Tracker ${suffix++}`;
  const result = await apiRequest(`/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] })
  });
  const properties = result.replies[0].addSheet.properties;
  await writeHeaders(spreadsheetId, properties.title);
  await formatTrackerSheet(spreadsheetId, properties.sheetId);
  return properties;
}

function driveQueryLiteral(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function findOrCreatePdfFolder() {
  const query = `name = '${driveQueryLiteral(PDF_FOLDER_NAME)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const parameters = new URLSearchParams({
    q: query,
    spaces: "drive",
    fields: "files(id,name)",
    pageSize: "10"
  });
  const result = await driveApiRequest(`/drive/v3/files?${parameters}`);
  if (result.files?.length) return result.files[0];
  return driveApiRequest("/drive/v3/files?fields=id,name", {
    method: "POST",
    body: JSON.stringify({ name: PDF_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" })
  });
}

async function uploadJobPdf(application) {
  const capturedAt = new Date();
  const folder = await findOrCreatePdfFolder();
  const name = JobSheetPdf.fileName(application, capturedAt);
  const bytes = await JobSheetPdf.create(application, { capturedAt });
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ name, parents: [folder.id] })], { type: "application/json" }));
  form.append("file", new Blob([bytes], { type: "application/pdf" }), name);
  const file = await driveApiRequest("/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    body: form
  });
  return {
    id: file.id,
    name: file.name || name,
    url: file.webViewLink || `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/view`
  };
}

function rowNumberFromRange(updatedRange) {
  const match = String(updatedRange || "").match(/![A-Z]+(\d+):/i);
  return match ? Number(match[1]) : null;
}

async function linkApplicationAssets(spreadsheetId, sheetId, rowNumber, sourceUrl, pdfFile) {
  if (!rowNumber) return;
  const requests = [];
  if (/^https?:\/\//i.test(sourceUrl || "")) {
    requests.push({
      updateCells: {
        range: {
          sheetId,
          startRowIndex: rowNumber - 1,
          endRowIndex: rowNumber,
          startColumnIndex: 0,
          endColumnIndex: 1
        },
        rows: [{ values: [{
          note: `Source job posting: ${sourceUrl}`,
          userEnteredFormat: { textFormat: { link: { uri: sourceUrl } } }
        }] }],
        fields: "note,userEnteredFormat.textFormat.link"
      }
    });
  }
  if (/^https?:\/\//i.test(pdfFile?.url || "")) {
    requests.push({
      updateCells: {
        range: {
          sheetId,
          startRowIndex: rowNumber - 1,
          endRowIndex: rowNumber,
          startColumnIndex: 5,
          endColumnIndex: 6
        },
        rows: [{ values: [{
          userEnteredValue: { stringValue: "Y" },
          note: `Job description PDF: ${pdfFile.name}`,
          userEnteredFormat: { textFormat: { link: { uri: pdfFile.url } } }
        }] }],
        fields: "userEnteredValue,note,userEnteredFormat.textFormat.link"
      }
    });
  }
  if (!requests.length) return;
  await apiRequest(`/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests })
  });
}

async function appendApplication(message) {
  const { spreadsheetId, sheetId, sheetTitle, application } = message;
  await prepareSheet(spreadsheetId, sheetId, sheetTitle);
  const finalizedApplication = JobSheetSchema.applicationForFiling(application);
  const pdfFile = await uploadJobPdf(finalizedApplication);
  const range = encodeURIComponent(`${JobSheetSchema.quoteSheetTitle(sheetTitle)}!A:G`);
  const result = await apiRequest(
    `/${encodeURIComponent(spreadsheetId)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&includeValuesInResponse=true`,
    { method: "POST", body: JSON.stringify({ values: [JobSheetSchema.applicationToRow(finalizedApplication)] }) }
  );
  const rowNumber = rowNumberFromRange(result.updates?.updatedRange);
  await linkApplicationAssets(spreadsheetId, sheetId, rowNumber, finalizedApplication.sourceUrl, pdfFile);
  return { rowNumber, updatedRange: result.updates?.updatedRange, pdfFile };
}

async function handleMessage(message) {
  switch (message.type) {
    case "CONFIG_STATUS":
      return { oauthConfigured: extensionConfigured() };
    case "GET_SPREADSHEET":
      return getSpreadsheet(message.spreadsheetId, message.interactive !== false);
    case "GET_HEADER":
      return { values: await getHeader(message.spreadsheetId, message.sheetTitle) };
    case "PREPARE_SHEET":
      return prepareSheet(message.spreadsheetId, message.sheetId, message.sheetTitle);
    case "CREATE_TRACKER_SHEET":
      return createTrackerSheet(message.spreadsheetId);
    case "APPEND_APPLICATION":
      return appendApplication(message);
    case "SIGN_OUT": {
      const token = await getAuthToken(false).catch(() => null);
      await clearToken(token);
      return { signedOut: true };
    }
    case "OPEN_OPTIONS":
      await chrome.runtime.openOptionsPage();
      return { opened: true };
    default:
      throw new Error("Unknown extension request.");
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: { message: error.message, code: error.code || "UNKNOWN" } }));
  return true;
});

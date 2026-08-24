importScripts("shared/schema.js");

const API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";

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

async function apiRequest(path, options = {}, interactive = true, retry = true) {
  const token = await getAuthToken(interactive);
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (response.status === 401 && retry) {
    await clearToken(token);
    return apiRequest(path, options, interactive, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error?.message || `Google Sheets returned ${response.status}.`);
    error.code = body.error?.status || `HTTP_${response.status}`;
    throw error;
  }
  return body;
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

function rowNumberFromRange(updatedRange) {
  const match = String(updatedRange || "").match(/![A-Z]+(\d+):/i);
  return match ? Number(match[1]) : null;
}

async function linkSource(spreadsheetId, sheetId, rowNumber, sourceUrl) {
  if (!rowNumber || !/^https?:\/\//i.test(sourceUrl || "")) return;
  await apiRequest(`/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [{
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
      }]
    })
  });
}

async function appendApplication(message) {
  const { spreadsheetId, sheetId, sheetTitle, application } = message;
  await prepareSheet(spreadsheetId, sheetId, sheetTitle);
  const range = encodeURIComponent(`${JobSheetSchema.quoteSheetTitle(sheetTitle)}!A:G`);
  const result = await apiRequest(
    `/${encodeURIComponent(spreadsheetId)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&includeValuesInResponse=true`,
    { method: "POST", body: JSON.stringify({ values: [JobSheetSchema.applicationToRow(application)] }) }
  );
  const rowNumber = rowNumberFromRange(result.updates?.updatedRange);
  await linkSource(spreadsheetId, sheetId, rowNumber, application.sourceUrl);
  return { rowNumber, updatedRange: result.updates?.updatedRange };
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

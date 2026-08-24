(function initializeJobSheetPanel() {
  const PANEL_ID = "job-sheet-capture-root";
  let lastUrl = location.href;
  let debounceTimer;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function send(message) {
    return chrome.runtime.sendMessage(message).then((response) => {
      if (!response?.ok) throw new Error(response?.error?.message || "The request could not be completed.");
      return response.data;
    });
  }

  function panelStyles() {
    return `
      :host { all:initial; color-scheme:light; --ink:#17201c; --muted:#52605a; --line:#cbd2cd; --forest:#123a2d; --mint:#dcebe3; --signal:#c84b31; font:14px/1.4 "Segoe UI",Arial,sans-serif; letter-spacing:0; }
      * { box-sizing:border-box; }
      .panel { position:fixed; z-index:2147483647; right:18px; bottom:18px; width:min(370px,calc(100vw - 28px)); max-height:min(720px,calc(100vh - 36px)); overflow:auto; background:#fff; color:var(--ink); border-radius:6px; box-shadow:0 12px 34px rgba(17,38,29,.2),0 3px 8px rgba(17,38,29,.1); animation:arrive .28s cubic-bezier(.16,1,.3,1); }
      @keyframes arrive { from { transform:translateY(12px); clip-path:inset(0 0 100% 0); } to { transform:none; clip-path:inset(0); } }
      header { min-height:58px; display:grid; grid-template-columns:1fr auto; align-items:center; padding:10px 12px 10px 14px; background:var(--forest); color:#fff; }
      h2 { margin:0; font-size:16px; line-height:1.2; letter-spacing:0; }
      header p { margin:2px 0 0; color:#cde0d5; font:700 10px/1.2 "Arial Narrow",Arial,sans-serif; text-transform:uppercase; letter-spacing:0; }
      button,input,select,textarea { font:inherit; letter-spacing:0; }
      button { cursor:pointer; } button:disabled { cursor:wait; opacity:.65; }
      .close { width:34px; height:34px; display:grid; place-items:center; border:0; border-radius:4px; background:transparent; color:#e5efe9; }
      .close:hover { background:rgba(255,255,255,.12); }
      svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      form,.setup { display:grid; gap:11px; padding:15px; }
      .heading { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
      .heading strong { display:block; margin-top:3px; font-size:18px; }
      .record-no,label { color:var(--muted); font:700 10px/1.2 "Arial Narrow",Arial,sans-serif; text-transform:uppercase; letter-spacing:0; }
      .stamp { padding:5px 6px 4px; border:1px solid var(--signal); border-radius:3px; color:var(--signal); font:800 10px/1 "Arial Narrow",Arial,sans-serif; transform:rotate(-2deg); }
      label { display:grid; gap:4px; }
      input,select,textarea { width:100%; min-height:37px; border:1px solid var(--line); border-radius:4px; padding:8px 9px; background:#fff; color:var(--ink); text-transform:none; }
      textarea { min-height:56px; resize:vertical; }
      input:focus,select:focus,textarea:focus,button:focus-visible { outline:3px solid rgba(20,108,148,.28); outline-offset:1px; }
      .row { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
      .primary { min-height:41px; display:flex; align-items:center; justify-content:center; border:1px solid var(--forest); border-radius:5px; background:var(--forest); color:#fff; font-weight:700; }
      .primary:hover { background:#0b2c21; }
      a.primary { text-decoration:none; }
      .notice { margin:0; padding:9px 10px; border-radius:4px; background:#e9eeea; color:#344139; font-size:12px; text-transform:none; }
      .notice.error { background:#f8e8e3; color:#7a2818; } .notice.success { background:var(--mint); color:#174a37; }
      .destination-row { min-width:0; display:flex; align-items:center; justify-content:space-between; gap:9px; padding-top:9px; border-top:1px solid var(--line); }
      .destination { min-width:0; color:var(--muted); font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-transform:none; }
      .change { border:0; background:transparent; color:var(--forest); padding:5px; font-weight:700; }
      .success-state { padding-block:24px; }
      .success-state h3 { margin:0; font-size:20px; } .success-state p { margin:0; color:var(--muted); text-transform:none; }
      .secondary { min-height:39px; border:1px solid #8b9891; border-radius:5px; background:#fff; color:var(--ink); font-weight:700; }
      .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
      .setup h3 { margin:2px 0 0; font-size:19px; } .setup p { margin:0 0 4px; color:var(--muted); text-transform:none; }
      @media (max-width:460px) { .panel { right:14px; bottom:14px; } .row { grid-template-columns:1fr; } }
      @media (prefers-reduced-motion:reduce) { .panel { animation:none; } }
    `;
  }

  function closePanel(host) {
    sessionStorage.setItem(`job-sheet-dismissed:${location.href}`, "1");
    host.remove();
  }

  async function buildPanel(job) {
    if (document.getElementById(PANEL_ID) || sessionStorage.getItem(`job-sheet-dismissed:${location.href}`)) return;
    const destination = await chrome.storage.sync.get(["spreadsheetId", "spreadsheetName", "sheetId", "sheetTitle"]);
    const host = document.createElement("div");
    host.id = PANEL_ID;
    const shadow = host.attachShadow({ mode: "open" });
    const statuses = JobSheetSchema.STATUSES.map((status) => `<option${status === "Interested" ? " selected" : ""}>${status}</option>`).join("");
    const connected = destination.spreadsheetId && destination.sheetTitle && destination.sheetId !== undefined;
    shadow.innerHTML = `<style>${panelStyles()}</style><div class="panel-live sr-only" role="status" aria-live="polite"></div><section class="panel" role="region" aria-label="Job Sheet capture panel">
      <header><div><h2>Job Sheet</h2><p>Application record</p></div><button class="close" type="button" title="Close panel" aria-label="Close Job Sheet panel"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      ${connected ? `<form>
        <div class="heading"><div><span class="record-no">NEW APPLICATION</span><strong>Review before filing</strong></div><span class="stamp">DRAFT</span></div>
        <label>Job title with requisition #<input name="titleAndRequisition" required value="${escapeHtml(job.titleAndRequisition)}"></label>
        <label>Organization<input name="organization" required value="${escapeHtml(job.organization)}"></label>
        <div class="row"><label>Application deadline<input name="deadline" type="date" value="${/^\d{4}-\d{2}-\d{2}$/.test(job.deadline) ? job.deadline : ""}"></label><label>Application date<input name="applicationDate" type="date" value=""></label></div>
        <div class="row"><label>Current status<select name="status">${statuses}</select></label><label>JD PDF saved?<select name="pdfSaved"><option>N</option><option>Y</option></select></label></div>
        <label>Outcomes / responses / next steps<textarea name="nextSteps" placeholder="Optional"></textarea></label>
        <p class="notice" hidden role="status" aria-live="polite"></p>
        <div class="destination-row"><span class="destination" title="${escapeHtml(destination.spreadsheetName || "Google Sheet")} / ${escapeHtml(destination.sheetTitle)}">${escapeHtml(destination.spreadsheetName || "Google Sheet")} / ${escapeHtml(destination.sheetTitle)}</span><button class="change" type="button">Change</button></div>
        <button class="primary" type="submit">File in Google Sheet</button>
      </form>` : `<div class="setup"><span class="record-no">SETUP</span><h3>Link your tracker</h3><p>Choose the Google Sheet where this posting should be filed.</p><button class="primary" type="button">Open spreadsheet setup</button></div>`}
    </section>`;
    shadow.querySelector(".close").addEventListener("click", () => closePanel(host));
    shadow.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePanel(host);
    });
    if (!connected) {
      shadow.querySelector(".primary").addEventListener("click", () => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" }));
    } else {
      const form = shadow.querySelector("form");
      const statusSelect = form.querySelector('[name="status"]');
      const applicationDate = form.querySelector('[name="applicationDate"]');
      statusSelect.addEventListener("change", () => {
        if (statusSelect.value === "Interested") applicationDate.value = "";
        else if (!applicationDate.value) applicationDate.value = JobSheetSchema.todayLocal();
      });
      form.querySelector(".change").addEventListener("click", () => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" }));
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector(".primary");
        const notice = form.querySelector(".notice");
        button.disabled = true;
        button.textContent = "Filing application…";
        notice.hidden = false;
        notice.className = "notice";
        notice.textContent = "Connecting to Google Sheets…";
        try {
          const application = { ...Object.fromEntries(new FormData(form)), sourceUrl: job.sourceUrl, description: job.description };
          const result = await send({ type: "APPEND_APPLICATION", ...destination, application });
          const confirmation = result.rowNumber ? `Filed in row ${result.rowNumber}.` : "Application filed.";
          shadow.querySelector(".panel-live").textContent = confirmation;
          form.className = "success-state";
          form.innerHTML = `<span class="record-no">FILED</span><h3>Application filed</h3><p>${escapeHtml(confirmation)} Open the tracker to verify the new record.</p><a class="primary" href="https://docs.google.com/spreadsheets/d/${encodeURIComponent(destination.spreadsheetId)}/edit" target="_blank" rel="noreferrer">Open Google Sheet</a><button class="secondary" type="button">Close</button>`;
          form.querySelector(".secondary").addEventListener("click", () => closePanel(host));
        } catch (error) {
          notice.className = "notice error";
          notice.textContent = error.message;
          button.disabled = false;
          button.textContent = "Try filing again";
        }
      });
    }
    document.documentElement.append(host);
    requestAnimationFrame(() => {
      shadow.querySelector(".panel-live").textContent = "Job Sheet found a job posting. Review the application record before filing.";
    });
  }

  async function inspect() {
    if (!/\/(?:job|details)\//i.test(location.pathname)) return;
    const job = JobSheetExtractor.extract(document, location);
    if (job.detected) await buildPanel(job);
  }

  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        document.getElementById(PANEL_ID)?.remove();
      }
      inspect();
    }, 350);
  });
  chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    const destinationKeys = ["spreadsheetId", "spreadsheetName", "sheetId", "sheetTitle"];
    if (!destinationKeys.some((key) => changes[key])) return;
    document.getElementById(PANEL_ID)?.remove();
    inspect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  inspect();
})();

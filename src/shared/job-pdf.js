(function exposeJobSheetPdf(root) {
  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN = 54;
  const FOOTER_HEIGHT = 42;
  const BODY_SIZE = 10.5;
  const BODY_LINE_HEIGHT = 15;

  function pdfLibrary() {
    if (root.PDFLib) return root.PDFLib;
    if (typeof require !== "undefined") return require("pdf-lib");
    throw new Error("The bundled PDF library is unavailable.");
  }

  function sanitizeText(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/\u2022/g, "-")
      .replace(/\u00a0/g, " ")
      .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function breakLongWord(word, font, size, maxWidth) {
    const pieces = [];
    let piece = "";
    for (const character of word) {
      const candidate = `${piece}${character}`;
      if (piece && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        pieces.push(piece);
        piece = character;
      } else {
        piece = candidate;
      }
    }
    if (piece) pieces.push(piece);
    return pieces;
  }

  function wrapText(value, font, size, maxWidth) {
    const paragraphs = sanitizeText(value).split(/\r?\n/);
    const lines = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      let line = "";
      words.forEach((word) => {
        const pieces = font.widthOfTextAtSize(word, size) > maxWidth
          ? breakLongWord(word, font, size, maxWidth)
          : [word];
        pieces.forEach((piece) => {
          const candidate = line ? `${line} ${piece}` : piece;
          if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
            lines.push(line);
            line = piece;
          } else {
            line = candidate;
          }
        });
      });
      if (line) lines.push(line);
      if (paragraphIndex < paragraphs.length - 1) lines.push("");
    });
    return lines.length ? lines : [""];
  }

  function fileName(application, capturedAt = new Date()) {
    const organization = sanitizeText(application.organization || "Organization");
    const title = sanitizeText(application.titleAndRequisition || application.title || "Job description");
    const date = capturedAt instanceof Date && !Number.isNaN(capturedAt.valueOf())
      ? capturedAt.toISOString().slice(0, 10)
      : "captured";
    const stem = `${organization} - ${title} - ${date}`
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140)
      .trim();
    return `${stem || "Job description"}.pdf`;
  }

  async function create(application, options = {}) {
    const { PDFDocument, StandardFonts, rgb } = pdfLibrary();
    const document = await PDFDocument.create();
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    const forest = rgb(0.071, 0.227, 0.176);
    const ink = rgb(0.09, 0.125, 0.11);
    const muted = rgb(0.322, 0.376, 0.353);
    const line = rgb(0.796, 0.824, 0.804);
    const capturedAt = options.capturedAt instanceof Date ? options.capturedAt : new Date();
    const title = sanitizeText(application.titleAndRequisition || application.title || "Job description");
    const organization = sanitizeText(application.organization || "Organization not detected");
    const sourceUrl = sanitizeText(application.sourceUrl || "Source URL unavailable");
    const descriptionSource = String(application.description || "").slice(0, 100000);
    const description = sanitizeText(descriptionSource) || "No job description text was available on the posting.";

    document.setTitle(title);
    document.setAuthor("Job Sheet");
    document.setSubject(`Job description captured from ${organization}`);
    document.setCreator("Job Sheet Chrome extension");
    document.setProducer("Job Sheet");
    document.setCreationDate(capturedAt);
    document.setModificationDate(capturedAt);

    let page;
    let y;

    function addPage(continued = false) {
      page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: forest });
      page.drawText(continued ? "JOB SHEET - JOB DESCRIPTION CONTINUED" : "JOB SHEET - JOB DESCRIPTION", {
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN,
        size: 9,
        font: bold,
        color: forest
      });
      y = PAGE_HEIGHT - MARGIN - 30;
    }

    function ensureSpace(height) {
      if (y - height < FOOTER_HEIGHT + 18) addPage(true);
    }

    function drawWrapped(value, font, size, color, lineHeight, gapAfter = 0) {
      const lines = wrapText(value, font, size, PAGE_WIDTH - (MARGIN * 2));
      lines.forEach((text) => {
        ensureSpace(lineHeight);
        if (text) page.drawText(text, { x: MARGIN, y, size, font, color });
        y -= lineHeight;
      });
      y -= gapAfter;
    }

    function drawMetadata(label, value) {
      ensureSpace(38);
      page.drawText(label, { x: MARGIN, y, size: 8, font: bold, color: muted });
      y -= 14;
      drawWrapped(value || "Not provided", regular, 10, ink, 13, 8);
    }

    addPage(false);
    drawWrapped(title, bold, 21, ink, 25, 4);
    drawWrapped(organization, regular, 12, muted, 16, 18);
    drawMetadata("APPLICATION DEADLINE", application.deadline || "Not provided");
    drawMetadata("APPLICATION DATE", application.applicationDate || capturedAt.toISOString().slice(0, 10));
    drawMetadata("SOURCE", sourceUrl);
    ensureSpace(42);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: line });
    y -= 28;
    page.drawText("JOB DESCRIPTION", { x: MARGIN, y, size: 10, font: bold, color: forest });
    y -= 24;
    drawWrapped(description, regular, BODY_SIZE, ink, BODY_LINE_HEIGHT);

    const pages = document.getPages();
    pages.forEach((currentPage, index) => {
      currentPage.drawLine({
        start: { x: MARGIN, y: FOOTER_HEIGHT },
        end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_HEIGHT },
        thickness: 0.7,
        color: line
      });
      currentPage.drawText(`Job Sheet - page ${index + 1} of ${pages.length}`, {
        x: MARGIN,
        y: 25,
        size: 8,
        font: regular,
        color: muted
      });
    });

    return document.save({ useObjectStreams: false });
  }

  const api = { create, fileName, sanitizeText, wrapText };
  root.JobSheetPdf = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

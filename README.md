# Job Sheet

Job Sheet is a Chrome Manifest V3 extension that extracts a job posting, lets the user verify the record, and appends it to a linked Google Sheets application tracker.

## What it does

- Detects job-detail pages on Workday, Greenhouse, Lever, SmartRecruiters, Ashby, iCIMS, Taleo, and SAP SuccessFactors and opens an on-page capture panel.
- Uses layered parsing: standard `JobPosting` structured data first, platform-specific DOM selectors second, and generic visible-page evidence as a fallback.
- Uses the toolbar popup on any HTTP(S) employer page without requesting automatic access to every website.
- Captures the seven tracker columns defined in [PRODUCT.md](PRODUCT.md).
- Connects directly to Google Sheets through Chrome Identity; there is no custom backend.
- Creates a clean job-description PDF in the user's `Job Sheet PDFs` Drive folder when a reviewed record is filed.
- Validates headings before every write and never overwrites a non-empty tab with a different layout.
- Adds the source posting URL to the first cell and the generated PDF link to the PDF-status cell.

## Local development

1. Follow the OAuth setup in [PUBLISHING.md](PUBLISHING.md).
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select this repository.
4. Open **Extension options** and paste a native Google Sheets URL. The first empty or compatible worksheet is selected automatically; otherwise choose or create a tracker tab.

## Job-page parsing

The extension parses the live DOM already rendered by Chrome, so it works with JavaScript-driven career pages without Selenium or a remote scraping server. Extracted values are always editable before filing. The toolbar includes selectors for LinkedIn and Indeed and a generic fallback for other employer sites that expose a recognizable title plus job-detail evidence such as an Apply action, requisition label, description, or detail URL.

Run the dependency-free tests with:

```bash
npm test
```

## Release

After the OAuth client ID is configured, `npm run package` creates the Chrome Web Store ZIP in `dist/`. See [PUBLISHING.md](PUBLISHING.md) for the account-bound release steps.

# Job Sheet

Job Sheet is a Chrome Manifest V3 extension that extracts a job posting, lets the user verify the record, and appends it to a linked Google Sheets application tracker.

## What it does

- Detects Workday job-detail pages and opens an on-page capture panel.
- Extracts standard `JobPosting` structured data on other sites when the toolbar popup is used.
- Captures the seven tracker columns defined in [PRODUCT.md](PRODUCT.md).
- Connects directly to Google Sheets through Chrome Identity; there is no custom backend.
- Validates headings before every write and never overwrites a non-empty tab with a different layout.
- Adds the source posting URL as the first cell's hyperlink and note.

## Local development

1. Follow the OAuth setup in [PUBLISHING.md](PUBLISHING.md).
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select this repository.
4. Open **Extension options**, paste a native Google Sheets URL, and choose or create a tracker tab.

Run the dependency-free tests with:

```bash
npm test
```

## Release

After the OAuth client ID is configured, `npm run package` creates the Chrome Web Store ZIP in `dist/`. See [PUBLISHING.md](PUBLISHING.md) for the account-bound release steps.

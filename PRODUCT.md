# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: a plain Chrome Manifest V3 extension using HTML, CSS, and JavaScript, with no build-time framework. This keeps local installation, review, and Chrome Web Store packaging transparent and lightweight.

## Users

Students and early-career job seekers who browse employer career sites and maintain a structured application tracker in Google Sheets.

## Product Purpose

Capture a job posting while the user is viewing it, let the user verify the extracted details, and append a consistently structured row to the user's own spreadsheet. Success means the tracker is updated accurately without repeated copying and pasting.

## Positioning

The extension works at the moment of discovery: it extracts a live posting into the user's existing tracking format and keeps the user in control of every field before saving.

## Operating Context

Users browse job-detail pages, including Workday postings, and maintain a Google Sheet with these columns: Job Title with Requisition #, Organization, Application deadline, Date of application, Current Status, PDF of JD saved? Y/N, and Outcomes/Responses/Next steps.

## Capabilities and Constraints

- A page-side capture panel appears automatically on recognized Workday job-detail pages; the toolbar popup also supports capture on the active page.
- The extension extracts job title, requisition number, organization, deadline, and source URL using structured job-posting data and site-specific fallbacks.
- Users can review and edit every value before it is saved.
- Google authentication uses Chrome Identity and the Google Sheets API. The extension does not operate its own backend or database.
- The user links a Google Sheets URL and chooses a worksheet. Microsoft Excel files opened through Google Drive must first be converted to native Google Sheets format for Sheets API writes.
- PDF generation and Drive upload are not part of the first release; the PDF column defaults to N.
- Public distribution requires a user-owned Google OAuth client ID, OAuth consent configuration, a Chrome Web Store developer account, and Google/Chrome review.

## Evidence on Hand

The repository contains the product name and purpose in README.md. The user supplied an RBC Workday posting URL, a representative Google spreadsheet URL, and the seven required tracker headings. No logo, testimonials, usage metrics, or public claims were supplied and none should be fabricated.

## Product Principles

- Keep the user's spreadsheet as the source of truth.
- Extract automatically, but require a clear human review before writing.
- Request only the permissions necessary for the current workflow.
- Make failures actionable, especially authentication, sheet-format, and extraction failures.
- Keep repeated capture fast enough to use for every application.

## Accessibility & Inclusion

All controls must be keyboard accessible, have visible focus states, preserve readable contrast, and avoid relying on color alone to communicate status.

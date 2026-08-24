# Chrome Web Store Listing

## Name

Job Sheet

## Summary

Review a job posting and file it directly in your own Google Sheets application tracker.

## Detailed description

Job Sheet removes repetitive copying from job applications. On supported hiring-platform job pages, it detects the posting and presents an editable application record. You can confirm the title and requisition number, organization, deadline, application date, status, PDF status, and next steps before adding one row to your selected Google Sheet.

The toolbar popup can also read standard JobPosting data on other job sites when you invoke it. Your spreadsheet remains the source of truth: Job Sheet has no custom backend, does not operate an advertising profile, and sends a record to Google Sheets only after you choose to file it.

Features:

- Automatic capture panel on Workday, Greenhouse, Lever, SmartRecruiters, Ashby, iCIMS, Taleo, and SAP SuccessFactors job-detail pages
- Generic parsing for other employer career pages through the toolbar popup
- Toolbar parsing for LinkedIn and Indeed job-detail pages
- Editable preview before every spreadsheet write
- Exact validation of the seven tracker headings
- Safe setup for empty tabs or a newly created Job Tracker tab
- Clickable source link on each filed job title
- Interested, Applied, Interviewing, Offer, Rejected, and Withdrawn statuses
- Clear recovery guidance for authentication, worksheet, and extraction errors

Native Google Sheets files are supported. Excel files stored in Google Drive must first be converted to Google Sheets format.

## Single purpose

Job Sheet captures a job posting that the user is viewing and files a user-reviewed application record in a Google spreadsheet selected by that user.

## Permission justifications

### `activeTab`

Used only after the user opens the toolbar popup, allowing Job Sheet to read the current job page and prepare the editable record.

### `scripting`

Used with `activeTab` to run the local job extractor on the current page. No remote code is executed.

### `identity`

Used to let the user authorize direct access to Google Sheets through their Google account.

### `storage`

Used to remember the selected spreadsheet and worksheet in Chrome synchronized storage.

### `https://sheets.googleapis.com/*`

Used to inspect worksheet headings, create or format a tracker tab when requested, and append reviewed application rows.

### Applicant-tracking-system content-script access

Used to detect job-detail pages on the declared Workday, Greenhouse, Lever, SmartRecruiters, Ashby, iCIMS, Taleo, and SAP SuccessFactors hosts and display the automatic capture panel. The extension does not read unrelated domains automatically; other sites are read only after the user invokes the toolbar popup under `activeTab` permission.

## Category

Productivity

## Language

English

## Support placeholders

Before submission, add the publisher-owned support email, homepage URL, hosted privacy-policy URL, and store artwork/screenshots.

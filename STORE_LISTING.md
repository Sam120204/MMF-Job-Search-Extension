# Chrome Web Store Listing

## Name

Job Sheet

## Summary

Review a job posting and file it directly in your own Google Sheets application tracker.

## Detailed description

Job Sheet removes repetitive copying from job applications. On supported hiring-platform job pages, it detects the posting and presents an editable application record. You can confirm the title and requisition number, organization, deadline, application date, status, and next steps before adding one row to your selected Google Sheet. When you file the record, Job Sheet also creates a clean job-description PDF in your Google Drive and links it from the tracker row.

The toolbar popup can also read standard JobPosting data on other job sites when you invoke it. Your spreadsheet remains the source of truth: Job Sheet has no custom backend, does not operate an advertising profile, and sends a record to Google Sheets only after you choose to file it.

Features:

- Automatic capture panel on Workday, Greenhouse, Lever, SmartRecruiters, Ashby, iCIMS, Taleo, and SAP SuccessFactors job-detail pages
- Generic parsing for other employer career pages through the toolbar popup
- Toolbar parsing for LinkedIn and Indeed job-detail pages
- Editable preview before every spreadsheet write
- Automatic job-description PDF creation in a dedicated Google Drive folder
- Clickable PDF link in every filed tracker row
- Exact validation of the seven tracker headings
- Automatic selection of the first empty or compatible worksheet
- Safe fallback when the first worksheet contains different columns
- Clickable source link on each filed job title
- Interested, Applied, Interviewing, Offer, Rejected, and Withdrawn statuses
- Clear recovery guidance for authentication, worksheet, and extraction errors

Native Google Sheets files are supported. Excel files stored in Google Drive must first be converted to Google Sheets format.

## Single purpose

Job Sheet captures a job posting that the user is viewing and files a user-reviewed application record, including a linked job-description PDF, in the user's selected Google spreadsheet and Google Drive.

## Permission justifications

### `activeTab`

Used only after the user opens the toolbar popup, allowing Job Sheet to read the current job page and prepare the editable record.

### `scripting`

Used with `activeTab` to run the local job extractor on the current page. No remote code is executed.

### `identity`

Used to let the user authorize direct access to Google Sheets and the PDF files Job Sheet creates in Google Drive.

### `storage`

Used to remember the selected spreadsheet and worksheet in Chrome synchronized storage.

### `https://sheets.googleapis.com/*`

Used to inspect worksheet headings, create or format a tracker tab when requested, and append reviewed application rows.

### `https://www.googleapis.com/drive/v3/*` and `https://www.googleapis.com/upload/drive/v3/*`

Used to create a dedicated `Job Sheet PDFs` folder, upload the job-description PDF requested by the user, and return its Drive link. The extension requests the limited `drive.file` OAuth scope and cannot browse unrelated Drive files.

### Applicant-tracking-system content-script access

Used to detect job-detail pages on the declared Workday, Greenhouse, Lever, SmartRecruiters, Ashby, iCIMS, Taleo, and SAP SuccessFactors hosts and display the automatic capture panel. The extension does not read unrelated domains automatically; other sites are read only after the user invokes the toolbar popup under `activeTab` permission.

## Category

Productivity

## Language

English

## Support placeholders

Before submission, add the publisher-owned support email, homepage URL, hosted privacy-policy URL, and store artwork/screenshots.

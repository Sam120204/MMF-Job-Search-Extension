# Publishing Job Sheet

The code runs without a custom backend. Public publishing still requires account-owned Google and Chrome configuration.

## 1. Create the OAuth client

1. Create or select a project in Google Cloud Console.
2. Enable the Google Sheets API.
3. Configure the OAuth consent screen and add the `https://www.googleapis.com/auth/spreadsheets` scope.
4. In Chrome, load this repository through `chrome://extensions` with Developer mode enabled and copy the generated extension ID.
5. Create an OAuth client of type **Chrome Extension** using that extension ID.
6. Replace `REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `manifest.json` with the generated client ID.
7. Reload the unpacked extension and test sign-in with an OAuth test user.

A Web Store listing has its own stable extension ID. Confirm the production OAuth client uses that ID before release.

## 2. Complete public metadata

- Replace the contact placeholder in `PRIVACY.md`.
- Host the privacy policy on a verified HTTPS domain.
- Add support and homepage URLs to the Chrome Web Store listing.
- Prepare 128×128 extension artwork, at least one 1280×800 or 640×400 screenshot, and the store description.
- Complete Chrome Web Store privacy disclosures consistently with `PRIVACY.md`.
- Use the prepared description and permission explanations in `STORE_LISTING.md`.
- Submit the OAuth consent screen for Google verification if Google requires it for public use.

## 3. Validate and package

```bash
npm test
npm run package
```

The packaging command refuses to create a release archive while the placeholder OAuth client ID remains. Its output is `dist/job-sheet-v0.1.0.zip`.

## 4. Submit

Upload the ZIP in the Chrome Web Store Developer Dashboard, complete the listing and privacy sections, choose public or restricted visibility, pay the one-time developer registration fee if the account has not already done so, and submit the item for review.

Chrome Web Store and Google OAuth approval are external reviews. Publication cannot be completed without access to the owner accounts.

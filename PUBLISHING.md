# Publishing Job Sheet

The code runs without a custom backend. Public publishing still requires account-owned Google and Chrome configuration.

Chrome Web Store Item ID: `fhmnoaldfiigmklfjdfblfhbkalglcjk`

## 1. Reserve the Chrome Web Store identity

The Google OAuth client must use the permanent Chrome Web Store Item ID. Reserve that ID before configuring OAuth:

1. Create the bootstrap archive:

   ```bash
   npm run package:bootstrap
   ```

2. In the Chrome Web Store Developer Dashboard, click **New item** and upload `dist/job-sheet-bootstrap-v0.1.0.zip`.
3. Keep the item as a draft. Do not submit it for review.
4. The item's **Item ID** is `fhmnoaldfiigmklfjdfblfhbkalglcjk`. Confirm that it matches the draft item you uploaded.
5. Click **View public key** and copy the complete public key.
6. Add that public key as the top-level `key` value in `manifest.json`. When the unpacked extension is reloaded, its local extension ID should match the Web Store Item ID.

The bootstrap package deliberately omits OAuth and is not a usable release. Its only purpose is to reserve the permanent identity. Its version is `0.1.0`, leaving the repository's release version available for the functional upload.

## 2. Create the OAuth client

1. Create or select a project in Google Cloud Console.
2. Enable the Google Sheets API and Google Drive API.
3. Configure the OAuth consent screen and add the `https://www.googleapis.com/auth/spreadsheets` and `https://www.googleapis.com/auth/drive.file` scopes.
4. Create an OAuth client of type **Chrome Extension** using the Web Store Item ID `fhmnoaldfiigmklfjdfblfhbkalglcjk`.
5. Replace `REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `manifest.json` with the generated client ID.
6. In Chrome, load this repository through `chrome://extensions` with Developer mode enabled.
7. Confirm its extension ID matches the Web Store Item ID, then test sign-in with an OAuth test user.

The Item ID, manifest public key, and OAuth client ID are public identifiers and may be committed. Never add an OAuth client secret, access token, or refresh token to the repository.

## 3. Complete public metadata

- Replace the contact placeholder in `PRIVACY.md`.
- Host the privacy policy on a verified HTTPS domain.
- Add support and homepage URLs to the Chrome Web Store listing.
- Prepare 128×128 extension artwork, at least one 1280×800 or 640×400 screenshot, and the store description.
- Complete Chrome Web Store privacy disclosures consistently with `PRIVACY.md`.
- Use the prepared description and permission explanations in `STORE_LISTING.md`.
- Submit the OAuth consent screen for Google verification if Google requires it for public use.

## 4. Validate and package

```bash
npm test
npm run package
```

The packaging command refuses to create a release archive while the placeholder OAuth client ID remains. Its output is versioned from the manifest, for example `dist/job-sheet-v0.3.0.zip`.

## 5. Submit

Upload the generated `dist/job-sheet-v0.3.0.zip` as the draft item's new package, complete the listing and privacy sections, choose public or restricted visibility, and submit the item for review.

Chrome Web Store and Google OAuth approval are external reviews. Publication cannot be completed without access to the owner accounts.

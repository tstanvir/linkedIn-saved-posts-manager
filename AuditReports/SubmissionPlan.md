# Chrome Web Store Submission Plan
**Project:** LinkedIn Saved Posts Manager
**Date:** 2026-03-27

---

## Step 1 — Fix all audit blockers

Complete every item in the V1 audit report before proceeding. Do not submit with open CRITICAL or HIGH findings.

---

## Step 2 — Write and host a Privacy Policy

A hosted privacy policy is **mandatory** for any extension that handles user data.

**Key points to cover:**
- What is collected: LinkedIn post content, author names, avatar URLs, post URLs — stored **locally only** in `chrome.storage.local` on the user's device.
- No data is transmitted to any external server. All AI enrichment (tag extraction, summary generation) runs locally inside the extension.
- Users can delete all stored data at any time using the extension's delete or bulk-delete functionality.
- No third-party analytics, tracking, or advertising SDKs are included.

**Where to host:**
- GitHub Pages (free, permanent URL)
- Notion public page
- Any static web host with a stable URL

---

## Step 3 — Prepare the store listing assets

| Asset | Spec | Notes |
|---|---|---|
| Name | Max 45 chars | "LinkedIn Saved Posts Manager" |
| Short description | Max 132 chars | "Browse, search, filter, and export your LinkedIn saved posts by tag — all locally, no account required." |
| Detailed description | Markdown supported | Explain features: sync, search, tag filter, dashboard, CSV/JSON export |
| Screenshots | 1–5 images, 1280×800 or 640×400 px | Show popup, dashboard, tag filter |
| Promotional tile | 440×280 px (optional but recommended) | Extension icon + name on brand background |
| Category | Productivity | |
| Language | English (add more later) | |

---

## Step 4 — Build and package

```bash
npm run build
# Zip only the dist/ folder — NOT the whole repo
cd dist && zip -r ../linkedin-saved-posts-manager-1.0.0.zip .
```

Verify the zip does **not** contain: `node_modules/`, `src/`, `.git/`, `.env`, or any test files.

---

## Step 5 — Developer Dashboard setup

1. Go to: https://chrome.google.com/webstore/devcenter
2. Pay the one-time **$5 USD** developer registration fee (if not already paid).
3. Click **Add new item** → upload the zip.
4. Fill in all listing fields from Step 3.
5. Enter the Privacy Policy URL from Step 2.

---

## Step 6 — Permission justifications

The review team requires written justification for each permission. Use these:

| Permission | Justification |
|---|---|
| `storage` | Persists scraped post data locally in `chrome.storage.local`. No external transmission. |
| `activeTab` | Activates the LinkedIn saved-posts tab when the user triggers a sync. |
| `host_permissions: https://www.linkedin.com/*` | Reads the DOM of the user's own LinkedIn saved posts page to extract post data on demand. Only triggered when the user explicitly clicks Sync. |

---

## Step 7 — Submit for review

After filling all fields, click **Submit for review**. You will receive an email when the extension is approved, or if the reviewer needs additional information.

---

## Post-approval checklist

- [ ] Test the published extension on a clean Chrome profile
- [ ] Verify the store listing screenshots match the shipped UI
- [ ] Set up a GitHub Issues page or email address as the support contact
- [ ] Plan version 1.0.1 for any immediate post-launch bug reports

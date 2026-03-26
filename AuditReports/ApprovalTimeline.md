# Chrome Web Store — Approval Timeline
**Project:** LinkedIn Saved Posts Manager
**Date:** 2026-03-27

---

## Typical review durations

| Scenario | Estimated Duration |
|---|---|
| Simple extension, no sensitive permissions | 1–2 business days |
| Extension with host permissions (e.g. linkedin.com) | 3–7 business days |
| Extension flagged for manual human review | 1–3 additional weeks |
| Re-submission after rejection | Resets queue — add 1–3 days |

---

## Expected timeline for this extension

**Realistic estimate: 3–10 business days**

This extension requests `host_permissions` for `https://www.linkedin.com/*`, which is a high-profile domain. LinkedIn is a named platform that Chrome's policy team watches closely. Expect a human reviewer to look at the scraping behavior.

**Factors that could extend review:**
- LinkedIn is a major platform — host permissions here will draw manual scrutiny.
- The extension reads and stores user data from a third-party site (even though it's the user's own data).
- Any ambiguity in the permission justifications provided.

**Factors that will speed up review:**
- All permissions are clearly justified in the submission form.
- No sensitive permissions like `tabs`, `webRequest`, or `debugger`.
- No remote code; all processing is local.
- Clear, honest store description that matches actual functionality.
- No deceptive or misleading UI patterns.

---

## What happens after submission

1. **Automated scan** (minutes): Google's automated system checks for malware, policy violations, and known bad patterns.
2. **Automated policy check** (hours): Checks permissions, CSP, manifest compliance.
3. **Human review** (1–7 business days): A Chrome Web Store reviewer looks at the extension, its listing, and its behavior.
4. **Decision**: Approved (you get an email + it goes live) or Rejected (email with reason).

---

## If rejected

- Read the rejection reason carefully — it will be specific.
- Common reasons for this type of extension:
  - Insufficient permission justification
  - Privacy policy missing or incomplete
  - Description does not accurately reflect functionality
  - LinkedIn ToS concerns (unlikely if scoped to user's own data)
- Fix the flagged issue, increment the version number, and resubmit.
- Each resubmission resets the review queue (add 1–3 business days).

---

## Going live

Once approved, the extension is **immediately available** in the Chrome Web Store. Users can install it directly. Updates follow the same review process but typically review faster (1–2 days) for minor version bumps.

---

## Notes on LinkedIn ToS

LinkedIn's robots.txt and ToS restrict automated scraping. However:
- This extension only accesses the user's **own** saved posts.
- Data is scraped only when the **user explicitly clicks Sync** — not automatically.
- No LinkedIn credentials are accessed or stored by the extension.
- This is comparable to a browser bookmark manager operating on pages the user visits.

Google's Chrome Web Store has approved similar read-only LinkedIn extensions in the past. The key is that the extension acts **on behalf of the user** and **only when the user initiates it**.

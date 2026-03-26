# Privacy Policy — LinkedIn Saved Posts Manager

**Last updated:** March 2026

## What this extension does

LinkedIn Saved Posts Manager lets you browse, search, and filter posts you've saved on LinkedIn — directly from a browser popup or a full-page dashboard tab.

## Data collection

**This extension does NOT collect, transmit, or share any user data.**

- All scraped post data is stored **locally** on your device in your browser's IndexedDB storage.
- No data is sent to any external server, API, or third-party service.
- No analytics, telemetry, or tracking of any kind is used.

## Data storage

- Post content, author info, and tags are stored in IndexedDB (local to your browser profile).
- Extension settings (popup size, preferences) are stored in `chrome.storage.local`.
- All data remains on your device and is never transmitted externally.

## Permissions

| Permission | Why it's needed |
|------------|-----------------|
| `storage` | Store your extension settings locally |
| `activeTab` | Access the active tab to scrape saved posts |
| `scripting` | Inject the content script on the LinkedIn saved posts page |
| `host_permissions: linkedin.com` | Read post data from the LinkedIn saved posts page |

## Data deletion

You can delete your data at any time:
- **Individual posts**: Click the ✕ button on any post card
- **Bulk delete**: Select posts in the dashboard and click "Delete"
- **Complete removal**: Uninstalling the extension removes all stored data

## Third-party services

This extension does **not** use any third-party services, APIs, or cloud infrastructure.

## Contact

For questions about this privacy policy, please open an issue on the project's GitHub repository.

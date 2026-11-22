# QuickSum Calculator (permission-free)
This version removes the previous Accessibility Service and its overlays entirely.
It cannot read or write PhonePe's payment amount field. Instead:
1. Type **28**, tap **+**.
2. Type **56**, tap **=**, see **84**.
3. Tap **Copy result**, switch back to PhonePe, paste **84** into the amount field, and **verify** before paying.

No app permissions, no networking, no background service, no automatic payment interaction.
Android's split-screen may be used where supported. Gboard remains unchanged.

## Why?
The previous side-loaded build requested Accessibility access to read/write a payment field, which can trigger Play Protect protections against financial fraud.
The exact reason for a specific block is only available from Google/device security reporting. No guarantee that a new build will install.

## Builds
GitHub Actions creates a **debug-signed test APK**, not a production release. Releasing publicly requires a developer-controlled signing key, verification and review. Never disable Play Protect to install.

Sources: https://developers.google.com/android/play-protect/warning-dev-guidance

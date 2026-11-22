# QuickSum Floating v0.3 (experimental)

## Requested UI
Only a horizontally scrolling expression row and six controls: **C ⌫ ÷ × − +**. The result is not shown in the overlay; when supported, the app attempts to update PhonePe's amount field automatically.

## Technical limitations
- Needs sensitive Android Accessibility capability and uses an Accessibility overlay.
- Google Play Protect previously blocked the earlier prototype; **this version is not an installation fix**. Do not disable or bypass Play Protect.
- PhonePe may prevent reading/writing the amount field. No guarantee of compatibility.
- Gboard types directly into PhonePe. When the app has just rendered a total, it interprets an unambiguous new suffix as the next operand. Certain IME cursor positions / field rewrites are ambiguous and are intentionally not guessed. Always verify the amount before paying.
- No internet permission, no payment submission, no PIN/OTP access.
- Mathematical order of operations: × and ÷ before + and −. Displayed amount is rounded to two decimal places, and nonpositive amounts aren't written.
- This is a debug-signed proof-of-concept, not an approved release APK.

The permission-free calculator remains on the `quicksum-overlay-apk` branch.

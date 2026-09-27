# PayPal VBV Checkout Demo

This project is a front-end demo that mimics a checkout page with a PayPal-style layout and a VBV / 3DS verification flow.

## Included features
- PayPal-inspired checkout UI
- Card brand detection
- Luhn validation for card numbers
- Expiry and CVV validation
- VBV / 3DS style security prompt
- Demo success state after verification

## Important note
This is a local demo only. It does not connect to a real payment provider, bank, or issuer. It is designed to display a realistic secure checkout flow without performing real card verification.

## Run it
Open `index.html` in a browser.

## Example valid card numbers
These are examples that pass the local Luhn check:
- 4111 1111 1111 1111 (Visa)
- 5555 5555 5555 4444 (MasterCard)
- 3782 822463 10005 (Amex)

## Demo flow
1. Enter a card number that passes validation.
2. Fill in name, expiry, and CVV.
3. Click Pay.
4. The page opens a secure verification dialog.
5. Enter a 6-digit code and confirm.
6. The demo marks the payment as approved.

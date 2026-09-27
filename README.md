# PayPal VBV Checkout Demo

A fuller storefront checkout demo that includes:
- multiple featured products
- card brand detection
- BIN issuer inspection
- Luhn validation
- expiry + CVV validation
- secure VBV / 3DS style modal
- local order approval flow and success page
- Express backend for card validation and order creation

## Run locally
1. `npm install`
2. `npm start`
3. Open `http://localhost:3000`

## Notes
This is a front-end demo. It simulates a secure checkout flow and validates card structure locally, but it does not connect to a real bank or payment provider.

## Example valid cards
- 4111 1111 1111 1111 (Visa)
- 5555 5555 5555 4444 (MasterCard)
- 3782 822463 10005 (Amex)

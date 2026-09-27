const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function detectCardBrand(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MasterCard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
  if (/^(35|2131|1800)/.test(digits)) return 'JCB';
  if (/^(30[0-5]|36|38)/.test(digits)) return 'Diners';
  return 'Card';
}

function luhnCheck(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (!/^\d+$/.test(digits) || digits.length < 12) return false;

  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

function validateCard({ cardNumber, cardName, expiry, cvv }) {
  const rawNumber = String(cardNumber || '').replace(/\D/g, '');
  const brand = detectCardBrand(rawNumber);

  if (rawNumber.length < 13 || rawNumber.length > 19) {
    return { valid: false, message: 'Card number length is invalid.' };
  }

  if (!luhnCheck(rawNumber)) {
    return { valid: false, message: 'Card number failed the Luhn validation.' };
  }

  if (!String(cardName || '').trim()) {
    return { valid: false, message: 'Please enter the cardholder name.' };
  }

  if (!/^\d{2}\/\d{2}$/.test(String(expiry || ''))) {
    return { valid: false, message: 'Expiry date must be in MM/YY format.' };
  }

  if (brand === 'Amex' && String(cvv || '').length !== 4) {
    return { valid: false, message: 'Amex CVV must be 4 digits.' };
  }

  if (brand !== 'Amex' && String(cvv || '').length !== 3) {
    return { valid: false, message: 'CVV must be 3 digits.' };
  }

  if (!['Visa', 'MasterCard', 'Amex', 'Discover', 'JCB', 'Diners'].includes(brand)) {
    return { valid: false, message: 'Unsupported card brand.' };
  }

  return {
    valid: true,
    brand,
    message: 'Card details passed validation.'
  };
}

app.post('/api/validate-card', (req, res) => {
  const result = validateCard(req.body || {});

  if (!result.valid) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

app.post('/api/verify-otp', (req, res) => {
  const { otp } = req.body || {};

  if (!/^\d{6}$/.test(String(otp || ''))) {
    return res.status(400).json({
      valid: false,
      message: 'OTP must be a 6-digit number.'
    });
  }

  return res.json({
    valid: true,
    message: 'Payment approved. VBV / 3DS simulation completed.'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

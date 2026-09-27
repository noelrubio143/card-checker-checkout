const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

function detectCardBrand(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MasterCard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
  if (/^(35|2131|1800)/.test(digits)) return 'JCB';
  if (/^(30[0-5]|36|38)/.test(digits)) return 'Diners';
  return 'Unknown';
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

function validateCard({ number, holder, expiry, cvv }) {
  const digits = String(number || '').replace(/\D/g, '');
  const brand = detectCardBrand(digits);

  if (!digits) return { ok: false, message: 'Card number is required.' };
  if (digits.length < 13 || digits.length > 19) return { ok: false, message: 'Card number length is invalid.' };
  if (!luhnCheck(digits)) return { ok: false, message: 'Card number is invalid.' };
  if (brand === 'Unknown') return { ok: false, message: 'Card brand is not supported.' };
  if (!String(holder || '').trim()) return { ok: false, message: 'Cardholder name is required.' };
  if (!/^\d{2}\/\d{2}$/.test(String(expiry || ''))) return { ok: false, message: 'Expiry must be MM/YY.' };
  if (brand === 'Amex' && String(cvv || '').length !== 4) return { ok: false, message: 'Amex CVV must be 4 digits.' };
  if (brand !== 'Amex' && String(cvv || '').length !== 3) return { ok: false, message: 'CVV must be 3 digits.' };

  return { ok: true, brand };
}

app.get('/api/check-card', (req, res) => {
  const result = validateCard({
    number: req.query.number || '',
    holder: req.query.holder || '',
    expiry: req.query.expiry || '',
    cvv: req.query.cvv || ''
  });

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json({ ok: true, brand: result.brand, message: 'Checkout successful. Card passed validation.' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

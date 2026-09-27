const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const products = [
  {
    id: 'aurora-buds',
    name: 'Aurora Wireless Buds',
    category: 'Audio',
    price: 129,
    image: '🎧',
    description: 'Noise cancelling • 30h battery'
  },
  {
    id: 'nova-watch',
    name: 'Nova Smart Watch',
    category: 'Wearables',
    price: 199,
    image: '⌚',
    description: 'GPS • Heart rate • AMOLED'
  },
  {
    id: 'pixel-cam',
    name: 'Pixel Pro Camera',
    category: 'Photography',
    price: 899,
    image: '📷',
    description: '4K • Pro lens • 1TB storage'
  }
];

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

function detectBinInfo(bin) {
  const digits = String(bin || '').replace(/\D/g, '').slice(0, 6);

  const mappings = {
    '411111': { bank: 'Chase', issuer: 'Visa', range: 'Visa Classic' },
    '555555': { bank: 'Bank of America', issuer: 'MasterCard', range: 'MasterCard Gold' },
    '378282': { bank: 'American Express', issuer: 'Amex', range: 'Amex Platinum' },
    '601101': { bank: 'Discover', issuer: 'Discover', range: 'Discover Standard' },
    '356600': { bank: 'JCB', issuer: 'JCB', range: 'JCB Premier' }
  };

  return mappings[digits] || {
    bank: 'Unknown issuer',
    issuer: detectCardBrand(digits),
    range: 'General card range'
  };
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

  const binInfo = detectBinInfo(rawNumber.slice(0, 6));

  return {
    valid: true,
    brand,
    binInfo,
    message: 'Card details passed validation.'
  };
}

app.get('/api/products', (req, res) => {
  res.json({ products });
});

app.get('/api/bin-check', (req, res) => {
  const { bin } = req.query;
  const info = detectBinInfo(bin || '');
  res.json({ bin: String(bin || '').slice(0, 6), ...info });
});

app.post('/api/validate-card', (req, res) => {
  const result = validateCard(req.body || {});

  if (!result.valid) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

app.post('/api/create-order', (req, res) => {
  const { productId, cardBrand, total } = req.body || {};
  const product = products.find((p) => p.id === productId) || products[0];
  const orderId = `ORD-${Date.now().toString().slice(-8)}`;

  res.json({
    success: true,
    orderId,
    productName: product.name,
    cardBrand: cardBrand || 'Card',
    total: Number(total || product.price),
    status: 'Approved',
    message: 'Payment approved and order created.'
  });
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

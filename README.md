const cardNumberInput = document.getElementById('cardNumber');
const cardNameInput = document.getElementById('cardName');
const expiryInput = document.getElementById('expiry');
const cvvInput = document.getElementById('cvv');
const paymentForm = document.getElementById('paymentForm');
const statusBox = document.getElementById('status');
const authModal = document.getElementById('authModal');
const otpInput = document.getElementById('otpInput');
const brandBadge = document.getElementById('brandBadge');
const cardNumberPreview = document.getElementById('cardNumberPreview');
const cardNamePreview = document.getElementById('cardNamePreview');
const expiryPreview = document.getElementById('expiryPreview');

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

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  const groups = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  return groups.join(' ');
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function updateCardPreview() {
  const number = formatCardNumber(cardNumberInput.value);
  const name = cardNameInput.value.trim() || 'YOUR NAME';
  const expiry = formatExpiry(expiryInput.value) || 'MM/YY';
  const brand = detectCardBrand(number);

  brandBadge.textContent = brand;
  cardNumberPreview.textContent = number ? number : '•••• •••• •••• ••••';
  cardNamePreview.textContent = name.toUpperCase();
  expiryPreview.textContent = expiry;
}

cardNumberInput.addEventListener('input', (e) => {
  e.target.value = formatCardNumber(e.target.value);
  updateCardPreview();
});

cardNameInput.addEventListener('input', updateCardPreview);

expiryInput.addEventListener('input', (e) => {
  e.target.value = formatExpiry(e.target.value);
  updateCardPreview();
});

cvvInput.addEventListener('input', () => {
  cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 4);
});

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function openAuthModal() {
  authModal.classList.add('open');
  authModal.setAttribute('aria-hidden', 'false');
  otpInput.value = '';
  otpInput.focus();
}

function closeAuthModal() {
  authModal.classList.remove('open');
  authModal.setAttribute('aria-hidden', 'true');
}

async function validateCardOnServer(payload) {
  const response = await fetch('/api/validate-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return { response, data };
}

async function verifyOtpOnServer(otp) {
  const response = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ otp })
  });

  const data = await response.json();
  return { response, data };
}

document.getElementById('cancelAuth').addEventListener('click', closeAuthModal);

document.getElementById('confirmAuth').addEventListener('click', async () => {
  const otp = otpInput.value.trim();
  if (!/^\d{6}$/.test(otp)) {
    otpInput.style.borderColor = 'red';
    otpInput.focus();
    return;
  }

  const { response, data } = await verifyOtpOnServer(otp);

  if (!response.ok) {
    showStatus(data.message || 'Verification failed.', 'error');
    closeAuthModal();
    return;
  }

  closeAuthModal();
  showStatus(data.message || 'Payment approved.', 'success');
});

paymentForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    cardNumber: cardNumberInput.value,
    cardName: cardNameInput.value,
    expiry: expiryInput.value,
    cvv: cvvInput.value
  };

  const { response, data } = await validateCardOnServer(payload);

  if (!response.ok) {
    showStatus(data.message || 'Validation failed.', 'error');
    return;
  }

  showStatus('Card details passed validation. Please complete the secure verification step.', 'success');
  openAuthModal();
});

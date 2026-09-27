const productList = document.getElementById('productList');
const totalPrice = document.getElementById('totalPrice');
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
const binInfoBox = document.getElementById('binInfo');

let productCatalog = [];
let selectedProductId = null;

const shippingRate = 12;
const taxRate = 0.12;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function getSelectedProduct() {
  return productCatalog.find((product) => product.id === selectedProductId) || productCatalog[0];
}

function calculateOrderTotal(product) {
  if (!product) return 0;
  const subtotal = Number(product.price || 0);
  const tax = subtotal * taxRate;
  return subtotal + shippingRate + tax;
}

function renderProducts(products) {
  productCatalog = products;
  selectedProductId = products[0]?.id || null;

  productList.innerHTML = products
    .map((product, index) => {
      const selectedClass = product.id === selectedProductId ? 'selected' : '';
      return `
        <div class="product-item ${selectedClass}" data-product-id="${product.id}">
          <div class="product-visual">${product.image}</div>
          <div class="product-copy">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
          </div>
          <div class="product-price">${formatCurrency(product.price)}</div>
        </div>
      `;
    })
    .join('');

  document.querySelectorAll('.product-item').forEach((item) => {
    item.addEventListener('click', () => {
      selectedProductId = item.dataset.productId;
      renderProducts(productCatalog);
      updateSummary();
    });
  });

  updateSummary();
}

function updateSummary() {
  const product = getSelectedProduct();
  if (!product) return;

  const total = calculateOrderTotal(product);
  totalPrice.textContent = formatCurrency(total);
}

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

  const rawNumber = number.replace(/\D/g, '');
  if (rawNumber.length >= 6) {
    fetch(`/api/bin-check?bin=${encodeURIComponent(rawNumber.slice(0, 6))}`)
      .then((res) => res.json())
      .then((data) => {
        const issuerText = `${data.issuer || 'Unknown'} • ${data.bank || 'Unknown issuer'} • ${data.range || 'General card range'}`;
        binInfoBox.textContent = issuerText;
      })
      .catch(() => {
        binInfoBox.textContent = 'Unable to inspect BIN.';
      });
  } else {
    binInfoBox.textContent = 'Enter a card number to inspect the BIN.';
  }
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
  otpInput.style.borderColor = '#e6edf8';
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

async function createOrderOnServer(payload) {
  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
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

  const selectedProduct = getSelectedProduct();
  const productTotal = calculateOrderTotal(selectedProduct);

  const orderRes = await createOrderOnServer({
    productId: selectedProduct.id,
    cardBrand: detectCardBrand(cardNumberInput.value),
    total: productTotal
  });

  if (!orderRes.response.ok) {
    showStatus(orderRes.data.message || 'Order failed.', 'error');
    closeAuthModal();
    return;
  }

  closeAuthModal();
  window.location.href = `/success.html?orderId=${encodeURIComponent(orderRes.data.orderId)}&product=${encodeURIComponent(orderRes.data.productName)}&brand=${encodeURIComponent(orderRes.data.cardBrand)}&total=${encodeURIComponent(orderRes.data.total)}`;
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

fetch('/api/products')
  .then((res) => res.json())
  .then((payload) => {
    renderProducts(payload.products || []);
  })
  .catch(() => {
    productList.innerHTML = '<div class="status error">Unable to load products.</div>';
  });

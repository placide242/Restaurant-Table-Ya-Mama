

//  numéro WhatsApp (sans espaces, avec indicatif)
const WA_NUMBER = '242067890123';

// Horaires d'ouverture (UTC+1, heure de Pointe-Noire)
const OPENING_HOUR = 10; // 10h00
const CLOSING_HOUR = 22; // 22h00

// Codes promo valides { code: discountRate }
const PROMO_CODES = {
  'BIENVENUE20': 0.20
};

//  STATE 
let cart       = [];
let promoCode  = null;   // code promo appliqué
let toastTimer = null;

//  INDICATEUR OUVERT / FERMÉ 
function isRestaurantOpen() {
  const now      = new Date();
  // Congo (Pointe-Noire) = UTC+1
  const congoHour  = (now.getUTCHours() + 1) % 24;
  const congoMin   = now.getUTCMinutes();
  const totalMins  = congoHour * 60 + congoMin;
  return totalMins >= OPENING_HOUR * 60 && totalMins < CLOSING_HOUR * 60;
}

function updateStatusIndicator() {
  const el = document.getElementById('restaurantStatus');
  if (!el) return;
  const open = isRestaurantOpen();
  el.className = 'status-indicator ' + (open ? 'open' : 'closed');
  el.innerHTML = `<span class="status-dot"></span>${open ? 'Ouvert maintenant' : 'Fermé · Ouvre à 10h'}`;
  el.setAttribute('aria-label', open ? 'Restaurant ouvert' : 'Restaurant fermé');
}

// Mise à jour toutes les minutes
updateStatusIndicator();
setInterval(updateStatusIndicator, 60_000);

//  MENU MOBILE 
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const btn      = document.querySelector('.mobile-menu-btn');
  const isOpen   = navLinks.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
}

// Fermer menu mobile en cliquant sur un lien
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

// Fermer menu mobile en cliquant à l'extérieur
document.addEventListener('click', (e) => {
  const nav      = document.querySelector('nav');
  const navLinks = document.querySelector('.nav-links');
  if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
    closeMobileMenu();
  }
});

function closeMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const btn      = document.querySelector('.mobile-menu-btn');
  navLinks.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

//  PANIER 
function addToCart(btn) {
  const card  = btn.closest('[data-name]');
  const name  = card.dataset.name;
  const price = parseFloat(card.dataset.price);
  const img   = card.dataset.img || card.querySelector('img')?.src || '';

  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, img, qty: 1 });
  }

  renderCart();
  showToast('✓ ' + name + ' ajouté au panier');
  btn.style.transform = 'scale(1.35)';
  setTimeout(() => (btn.style.transform = ''), 200);
}

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
}

function getSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getDiscount(subtotal) {
  if (!promoCode) return 0;
  const rate = PROMO_CODES[promoCode] || 0;
  return Math.round(subtotal * rate);
}

function getFinalTotal() {
  const sub = getSubtotal();
  return sub - getDiscount(sub);
}

function renderCart() {
  const body        = document.getElementById('cartBody');
  const emptyEl     = document.getElementById('cartEmpty');
  const footEl      = document.getElementById('cartFoot');
  const badge       = document.getElementById('cartBadge');
  const subtotalEl  = document.getElementById('cartSubtotal');
  const totalEl     = document.getElementById('cartTotal');
  const discRowEl   = document.getElementById('cartDiscountRow');
  const discountEl  = document.getElementById('cartDiscount');

  const count    = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = getSubtotal();
  const discount = getDiscount(subtotal);
  const total    = subtotal - discount;

  // Badge
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';

  // Affichage vide / footer
  emptyEl.style.display = cart.length === 0 ? 'block' : 'none';
  footEl.style.display  = cart.length > 0  ? 'block' : 'none';

  // Totaux
  subtotalEl.textContent = formatPrice(subtotal);
  totalEl.textContent    = formatPrice(total);

  if (discount > 0) {
    discRowEl.style.display = 'flex';
    discountEl.textContent  = '−' + formatPrice(discount);
  } else {
    discRowEl.style.display = 'none';
  }

  // Rebuild cart items (remove old, add new)
  body.querySelectorAll('.cart-item').forEach(el => el.remove());
  cart.forEach((item, idx) => {
    const div       = document.createElement('div');
    div.className   = 'cart-item';
    div.innerHTML   = `
      <img src="${sanitize(item.img)}" alt="${sanitize(item.name)}" width="58" height="58"/>
      <div class="ci-info">
        <div class="ci-name">${sanitize(item.name)}</div>
        <div class="ci-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <div class="ci-qty">
        <button type="button" onclick="changeQty(${idx},-1)" aria-label="Diminuer quantité ${sanitize(item.name)}">−</button>
        <span aria-label="Quantité">${item.qty}</span>
        <button type="button" onclick="changeQty(${idx},1)"  aria-label="Augmenter quantité ${sanitize(item.name)}">+</button>
      </div>`;
    body.appendChild(div);
  });
}

// VIDER LE PANIER
function clearCart() {
  if (cart.length === 0) {
    showToast('⚠ Votre panier est déjà vide');
    return;
  }
  cart = [];
  promoCode = null; // Réinitialiser le code promo aussi
  renderCart();
  showToast('🗑 Panier vidé');
}

//  CODE PROMO 
function applyPromo() {
  const input     = document.getElementById('promoInput');
  const appliedEl = document.getElementById('promoApplied');
  const code      = input.value.trim().toUpperCase();

  if (!code) {
    showToast('⚠ Saisissez un code promo');
    return;
  }

  if (PROMO_CODES[code]) {
    promoCode              = code;
    appliedEl.style.display = 'flex';
    input.disabled          = true;
    document.querySelector('.btn-promo').disabled = true;
    renderCart();
    showToast('🎉 Code ' + code + ' appliqué !');
  } else {
    showToast('✕ Code promo invalide');
    input.value = '';
    input.focus();
  }
}

// Support touche Entrée dans le champ promo
document.getElementById('promoInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyPromo();
});

//  CHECKOUT WHATSAPP 
function checkoutWhatsApp() {
  if (cart.length === 0) {
    showToast('⚠ Votre panier est vide');
    return;
  }

  const subtotal = getSubtotal();
  const discount = getDiscount(subtotal);
  const total    = subtotal - discount;

  let message = '🍽️ *Commande — Table Ya Mama*\n\n';

  cart.forEach(item => {
    message += `• ${item.qty}x ${item.name}`;
    message += ` — ${formatPrice(item.price * item.qty)}\n`;
  });

  message += `\n💰 *Sous-total : ${formatPrice(subtotal)}*`;

  if (discount > 0) {
    message += `\n🎟️ *Réduction (${promoCode}) : −${formatPrice(discount)}*`;
    message += `\n✅ *Total à payer : ${formatPrice(total)}*`;
  } else {
    message += `\n✅ *Total à payer : ${formatPrice(total)}*`;
  }

  message += '\n\n📍 *Merci de préciser votre adresse de livraison.*';
  message += '\n\nMerci et à tout de suite ! 😊';

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

//  OUVERTURE / FERMETURE DU PANIER 
function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  closeMobileMenu();
  // Focus le panier pour l'accessibilité
  setTimeout(() => document.querySelector('.cart-close')?.focus(), 300);
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// Fermer le panier avec Echap
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('cartDrawer').classList.contains('open')) {
    closeCart();
  }
});

//  FILTRE MENU 
function filterMenu(cat, btn) {
  // Mise à jour des onglets
  document.querySelectorAll('.filter-tabs .tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');

  // Affichage des cartes
  document.querySelectorAll('#menuGrid .menu-card').forEach(card => {
    const show = cat === 'tous' || card.dataset.cat === cat;
    card.style.display = show ? '' : 'none';
  });
}

//  TOAST 
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

//  SCROLL REVEAL 
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target); // Déclencher une seule fois
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Stagger des cartes
document.querySelectorAll(
  '.menu-grid .menu-card, .specials-grid .special-card, .delivery-grid .delivery-card, .reviews-grid .review-card'
).forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 80 + 'ms';
});

// UTILITAIRES
/** Formatte un prix en FCFA avec espace milliers */
function formatPrice(amount) {
  return Math.round(amount).toLocaleString('fr-FR') + ' FCFA';
}

/** Protège contre les injections XSS dans le DOM */
function sanitize(str) {
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(String(str)));
  return el.innerHTML;
}
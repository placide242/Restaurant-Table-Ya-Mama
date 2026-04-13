// CART STATE 

let cart = [];

// MOBILE MENU
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('open');
}

// CART FUNCTIONS
function addToCart(btn) {
  const card = btn.closest('[data-name]');
  const name  = card.dataset.name;
  const price = parseFloat(card.dataset.price);
  const img   = card.dataset.img || card.querySelector('img')?.src || '';
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty++;
  else cart.push({ name, price, img, qty: 1 });
  renderCart();
  showToast('✓ ' + name + ' ajouté au panier');
  btn.style.transform = 'scale(1.35)';
  setTimeout(() => (btn.style.transform = ''), 200);
}

function changeQty(idx, d) {
  cart[idx].qty += d;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
}

function renderCart() {
  const body    = document.getElementById('cartBody');
  const empty   = document.getElementById('cartEmpty');
  const foot    = document.getElementById('cartFoot');
  const badge   = document.getElementById('cartBadge');
  const totalEl = document.getElementById('cartTotal');

  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s,i) => s + i.qty, 0);

  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
  empty.style.display = cart.length === 0 ? 'block' : 'none';
  foot.style.display  = cart.length > 0  ? 'block' : 'none';
  totalEl.textContent = total.toFixed(0) + ' FCFA';

  body.querySelectorAll('.cart-item').forEach(el => el.remove());
  cart.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}"/>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">${(item.price * item.qty).toFixed(0)} FCFA</div>
      </div>
      <div class="ci-qty">
        <button onclick="changeQty(${idx},-1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${idx},1)">+</button>
      </div>`;
    body.appendChild(div);
  });
}

function openCart()  {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Close mobile menu when cart opens
  document.querySelector('.nav-links').classList.remove('open');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// MENU FILTER
function filterMenu(cat, btn) {
  document.querySelectorAll('.filter-tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#menuGrid .menu-card').forEach(card => {
    const show = cat === 'tous' || card.dataset.cat === cat;
    card.style.display = show ? '' : 'none';
  });
}

// TOAST
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// SCROLL REVEAL 
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// stagger cards
document.querySelectorAll('.menu-grid .menu-card, .specials-grid .special-card, .delivery-grid .delivery-card').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 80 + 'ms';
});

// Close mobile menu when clicking nav links
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  const nav = document.querySelector('nav');
  const navLinks = document.querySelector('.nav-links');
  const mobileBtn = document.querySelector('.mobile-menu-btn');

  if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
  }
});
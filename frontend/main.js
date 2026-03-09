// ── PAGE SYSTEM ┙
let currentPage = 'home';

// ── SPECIALTY PANEL ──
function toggleSpecialtyPanel() {
  const panel = document.getElementById('specialtyPanel');
  const overlay = document.getElementById('specialtyOverlay');
  const btn = document.getElementById('specialtyNavBtn');
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    btn.classList.remove('open');
  } else {
    panel.classList.add('open');
    overlay.classList.add('open');
    btn.classList.add('open');
  }
}
function closeSpecialtyPanel() {
  document.getElementById('specialtyPanel').classList.remove('open');
  document.getElementById('specialtyOverlay').classList.remove('open');
  document.getElementById('specialtyNavBtn').classList.remove('open');
}
// Close on Escape key
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSpecialtyPanel(); });

// ── "OTHER" SPECIALTY TOGGLE ──
function handleSpecialtyChange(prefix) {
  const sel = document.getElementById(prefix + '-specialty');
  const customInput = document.getElementById(prefix + '-specialty-custom');
  if (sel.value === '__other__') {
    customInput.classList.add('visible');
    customInput.focus();
  } else {
    customInput.classList.remove('visible');
    customInput.value = '';
  }
}

function showPage(pageId) {
  closeSpecialtyPanel();
  const current = document.getElementById('page-' + currentPage);
  const next = document.getElementById('page-' + pageId);
  if (!next || currentPage === pageId) return;

  current.classList.add('slide-out');
  setTimeout(() => {
    current.classList.remove('slide-out','active');
    current.style.display = 'none';
    next.style.display = 'block';
    requestAnimationFrame(() => {
      next.classList.add('active','slide-in');
      window.scrollTo({top:0,behavior:'instant'});
      currentPage = pageId;
      setTimeout(() => {
        next.classList.remove('slide-in');
        triggerReveal();
      }, 700);
    });
  }, 400);
}

function scrollToContact() {
  if (currentPage !== 'home') {
    showPage('home');
    setTimeout(() => {
      document.getElementById('contactSection').scrollIntoView({behavior:'smooth',block:'start'});
    }, 800);
  } else {
    document.getElementById('contactSection').scrollIntoView({behavior:'smooth',block:'start'});
  }
}

// ── SCROLL ANIMATIONS ──
function triggerReveal() {
  const revealEls = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.1});
  revealEls.forEach(el => observer.observe(el));
}

// ── NAVBAR SCROLL ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// ── FORM SUBMISSIONS ──
const BACKEND_URL = 'http://localhost:3000/api/contact';

async function submitForm(payload, btn, originalText) {
  btn.textContent = 'Sending...';
  btn.disabled = true;
  try {
    const res = await fetch(BACKEND_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      btn.textContent = '✓ Submitted — We\'ll Be in Touch!';
      btn.style.background = 'linear-gradient(135deg,#059669,#065f46)';
    } else {
      alert(data.message || 'Something went wrong.');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  } catch {
    alert('Network error. Please try again.');
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function submitHeroForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  submitForm({
    firstName: document.getElementById('h-fname').value,
    lastName:  document.getElementById('h-lname').value,
    email:     document.getElementById('h-email').value,
    phone:     document.getElementById('h-phone').value,
    practice:  document.getElementById('h-practice').value,
    specialty: document.getElementById('h-specialty').value === '__other__'
               ? (document.getElementById('h-specialty-custom').value || 'Other')
               : document.getElementById('h-specialty').value,
    size:      document.getElementById('h-size').value,
    service:   document.getElementById('h-service').value,
    message:   document.getElementById('h-message').value,
  }, btn, 'Request Free Assessment →');
  return false;
}

function submitContactSection(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  submitForm({
    firstName: document.getElementById('c-fname').value,
    lastName:  document.getElementById('c-lname').value,
    email:     document.getElementById('c-email').value,
    phone:     document.getElementById('c-phone').value,
    practice:  document.getElementById('c-practice').value,
    specialty: document.getElementById('c-specialty').value === '__other__'
               ? (document.getElementById('c-specialty-custom').value || 'Other')
               : document.getElementById('c-specialty').value,
    size:      document.getElementById('c-size').value,
    service:   document.getElementById('c-service').value,
    message:   document.getElementById('c-message').value,
  }, btn, 'Request Free Assessment →');
  return false;
}

// ── WHY TABS ──
function activateTab(el) {
  document.querySelectorAll('.why-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ── INIT ──
function initApp() {
  // keep loader visible briefly to allow entrance animations
  setTimeout(() => {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('hidden');
    const home = document.getElementById('page-home');
    if (home) { home.style.display = 'block'; home.classList.add('active'); }
    if (typeof triggerReveal === 'function') triggerReveal();
  }, 800);

  // Fix nav logo to use transparent background PNG
  const navLogoImg = document.querySelector('.nav-logo img');
  if (navLogoImg) {
    navLogoImg.src = '../reference/logo-removebg-preview.png';
    navLogoImg.onerror = function() { this.src = '/reference/logo-removebg-preview.png'; };
  }

  // interactive shader tracking for hero background
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      hero.style.setProperty('--mx', x + '%');
      hero.style.setProperty('--my', y + '%');
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);
// Fallback: ensure loader is removed after 3s even if DOMContentLoaded delayed
setTimeout(() => {
  const loader = document.getElementById('page-loader');
  const home = document.getElementById('page-home');
  if (loader && !loader.classList.contains('hidden')) {
    loader.classList.add('hidden');
    if (home) { home.style.display = 'block'; home.classList.add('active'); }
    if (typeof triggerReveal === 'function') triggerReveal();
  }
}, 3000);

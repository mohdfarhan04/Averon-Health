// Shared motion preference controls the persistent video and all card carousels.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedMotion.matches;
const video = document.getElementById('siteVideo');
const motionToggle = document.getElementById('motionToggle');
const assetRoot = new URL('assets/', document.baseURI).href;
let pageReady = document.readyState === 'complete';
let playbackAttempt = 0;
function syncMotion() {
  const attempt = ++playbackAttempt;
  document.body.classList.toggle('motion-paused', motionPaused);
  motionToggle.textContent = motionPaused ? 'Play motion' : 'Pause motion';
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  if (motionPaused || document.hidden || !pageReady) {
    video.pause();
  } else {
    if (!video.getAttribute('src')) video.src = assetRoot + 'globe.mp4';
    video.play().catch(() => {
      if (attempt !== playbackAttempt || document.hidden) return;
      motionPaused = true;
      syncMotion();
    });
  }
}
motionToggle.addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
reducedMotion.addEventListener('change', () => { motionPaused = reducedMotion.matches; syncMotion(); });
document.addEventListener('visibilitychange', syncMotion);
if (!pageReady) window.addEventListener('load', () => { pageReady = true; syncMotion(); }, {once:true});
syncMotion();

function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach((stage, carouselIndex) => {
    const cards = [...stage.children];
    const wrapper = document.createElement('div');
    wrapper.className = 'motion-carousel';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-roledescription', 'carousel');
    wrapper.setAttribute('aria-label', stage.dataset.carousel);
    stage.before(wrapper);
    wrapper.append(stage);
    stage.classList.add('carousel-stage');
    stage.id = 'carousel-' + carouselIndex;
    stage.tabIndex = 0;
    stage.setAttribute('aria-label', stage.dataset.carousel + ': use left and right arrow keys to browse');
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    const makeArrow = (label, symbol, step) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'carousel-arrow';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-controls', stage.id);
      button.textContent = symbol;
      button.addEventListener('click', () => move(index + step, true));
      return button;
    };
    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    const status = document.createElement('span');
    status.className = 'sr-only';
    status.setAttribute('aria-live', 'polite');
    const dotButtons = cards.map((card, i) => {
      card.classList.add('carousel-card');
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', (i + 1) + ' of ' + cards.length);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', 'Show card ' + (i + 1));
      dot.setAttribute('aria-controls', stage.id);
      dot.addEventListener('click', () => move(i, true));
      dots.append(dot);
      return dot;
    });
    controls.append(makeArrow('Previous card', '\u2190', -1), dots, makeArrow('Next card', '\u2192', 1));
    wrapper.append(controls, status);
    let index = 0, hovering = false, onScreen = false, lastMove = Date.now();
    function render() {
      if (!stage.clientWidth) return;
      const step = Math.min(cards[0].offsetWidth * .85, stage.clientWidth * .6);
      cards.forEach((card, i) => {
        let distance = (i - index + cards.length) % cards.length;
        if (distance > cards.length / 2) distance -= cards.length;
        const active = distance === 0;
        const visible = Math.abs(distance) <= 1;
        card.style.transform = `translateX(calc(-50% + ${distance * step}px)) translateY(${active ? 0 : 18}px) rotateY(${-distance * 9}deg) scale(${active ? 1 : .86})`;
        card.style.opacity = active ? '1' : visible ? '.55' : '0';
        card.style.zIndex = active ? '3' : visible ? '2' : '0';
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.classList.toggle('is-current', active);
        card.inert = !active;
        card.setAttribute('aria-hidden', String(!active));
        dotButtons[i].setAttribute('aria-current', String(active));
      });
    }
    function measure() {
      if (!stage.clientWidth) return;
      cards.forEach(card => card.style.height = 'auto');
      const height = Math.max(...cards.map(card => card.offsetHeight));
      cards.forEach(card => card.style.height = height + 'px');
      stage.style.height = height + 64 + 'px';
      render();
    }
    function move(next, announce = false) {
      index = (next + cards.length) % cards.length;
      lastMove = Date.now();
      render();
      if (announce) status.textContent = 'Card ' + (index + 1) + ' of ' + cards.length;
    }
    wrapper.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hovering = true; });
    wrapper.addEventListener('pointerleave', () => { hovering = false; lastMove = Date.now(); });
    wrapper.addEventListener('focusout', () => { lastMove = Date.now(); });
    stage.addEventListener('keydown', event => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      stage.focus({preventScroll:true});
      move(index + step, true);
    });
    let gesture = null;
    stage.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('button,a,input')) return;
      gesture = {x:event.clientX, y:event.clientY, id:event.pointerId};
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointerup', event => {
      if (!gesture) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(index + (dx < 0 ? 1 : -1), true);
      gesture = null;
    });
    stage.addEventListener('pointercancel', () => { gesture = null; });
    new ResizeObserver(measure).observe(stage);
    new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; lastMove = Date.now(); }, {threshold:.5}).observe(stage);
    setInterval(() => {
      if (!motionPaused && !document.hidden && onScreen && !hovering && !gesture && !wrapper.contains(document.activeElement) && Date.now() - lastMove >= 6500) move(index + 1);
    }, 1000);
    document.fonts.ready.then(measure);
    measure();
  });
}

// ── PAGE SYSTEM ──
let currentPage = 'home';

// ── SPECIALTY PANEL ──
function setSpecialtyPanel(open) {
  ['specialtyPanel', 'specialtyOverlay', 'specialtyNavBtn'].forEach(id => {
    document.getElementById(id).classList.toggle('open', open);
  });
}
function toggleSpecialtyPanel() {
  setSpecialtyPanel(!document.getElementById('specialtyPanel').classList.contains('open'));
}
function closeSpecialtyPanel() {
  setSpecialtyPanel(false);
}
// Close on Escape key handled in initApp

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

function handlePracticeTypeChange(prefix) {
  const sel = document.getElementById(prefix + '-practice-type');
  const practiceNameGroup = document.getElementById(prefix + '-practice-name-group');
  if (sel.value === 'Group Practice') {
    practiceNameGroup.style.display = 'block';
    document.getElementById(prefix + '-practice').focus();
  } else {
    practiceNameGroup.style.display = 'none';
    document.getElementById(prefix + '-practice').value = '';
  }
}

function showPage(pageId) {
  closeSpecialtyPanel();
  closeMobileNav();
  const current = document.getElementById('page-' + currentPage);
  const next = document.getElementById('page-' + pageId);
  if (!next || currentPage === pageId) return;

  current.classList.add('slide-out','animating');
  setTimeout(() => {
    current.classList.remove('slide-out','active','animating');
    current.style.display = 'none';
    next.style.display = 'block';
    next.classList.add('animating');
    requestAnimationFrame(() => {
      next.classList.add('active','slide-in');
      window.scrollTo({top:0,behavior:'instant'});
      currentPage = pageId;
      setTimeout(() => {
        next.classList.remove('slide-in','animating');
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

// ── SCROLL ANIMATIONS — fixed Observer leak ──
const _revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      _revealObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.1});

function triggerReveal() {
  document.querySelectorAll('.reveal,.reveal-left').forEach(el => {
    if (!el.classList.contains('visible')) _revealObserver.observe(el);
  });
}

// ── NAVBAR SCROLL — passive listener ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
}, {passive: true});

// ── FORM SUBMISSIONS ──
// When served through Node.js, /api/contact is the same server.
// When opened as a file:// URL, fall back to localhost:3000.
const BACKEND_URL = (location.protocol === 'file:')
  ? 'http://localhost:3000/api/contact'
  : '/api/contact';

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
      alert(data.message || 'Something went wrong. Please try again.');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  } catch (err) {
    console.error('Form submission error:', err);
    alert('Could not reach the server. Make sure the backend is running (npm start in the backend folder) and try again.');
    btn.textContent = originalText;
    btn.disabled = false;
  }
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

// ── HAMBURGER / MOBILE NAV ──
function setMobileNav(open) {
  document.getElementById('mobileNav').classList.toggle('open', open);
  const btn = document.getElementById('hamburgerBtn');
  btn.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
}
function toggleMobileNav() {
  setMobileNav(!document.getElementById('mobileNav').classList.contains('open'));
}
function closeMobileNav() {
  setMobileNav(false);
}

// ── INIT ──
function bindInterfaceEvents() {
  const actions = {
    page: element => showPage(element.dataset.page),
    assessment: () => { showPage('home'); setTimeout(scrollToContact, 400); },
    contact: scrollToContact,
    'contact-close-specialty': () => { scrollToContact(); closeSpecialtyPanel(); },
    'toggle-mobile': toggleMobileNav,
    'toggle-specialty': toggleSpecialtyPanel,
    'specialty-from-mobile': () => { toggleSpecialtyPanel(); closeMobileNav(); },
    'close-specialty': closeSpecialtyPanel,
  };
  document.addEventListener('click', event => {
    const element = event.target.closest('[data-action]');
    if (element && actions[element.dataset.action]) actions[element.dataset.action](element);
  });
  document.querySelectorAll('[data-change]').forEach(element => {
    element.addEventListener('change', () => {
      if (element.dataset.change === 'practice-type') handlePracticeTypeChange(element.dataset.prefix);
      else handleSpecialtyChange(element.dataset.prefix);
    });
  });
  document.querySelector('[data-contact-form]').addEventListener('submit', submitContactSection);
}

function initApp() {
  bindInterfaceEvents();
  initCarousels();
  setTimeout(finishLoading, 800);

  // Close mobile nav on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMobileNav(); closeSpecialtyPanel(); }
  });
}

function finishLoading() {
  const loader = document.getElementById('page-loader');
  if (!loader || loader.classList.contains('hidden')) return;
  loader.classList.add('hidden');
  const home = document.getElementById('page-home');
  home.style.display = 'block';
  home.classList.add('active');
  triggerReveal();
}

document.addEventListener('DOMContentLoaded', initApp);
setTimeout(finishLoading, 3000);

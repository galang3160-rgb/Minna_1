/* =========================================================
   SOUMATOME — Flashcard Logic (Dynamic Fetch Data & Touch Support)
   ========================================================= */

/* ── STATE ── */
let cards = [];
let currentIndex = 0;
let isFlipped = false;
let isAnimating = false;

/* Touch Swipe Variables */
let touchStartX = 0;
let touchStartY = 0;

/* ── DOM REFS ── */
const cardDeck       = document.getElementById('cardStage')?.querySelector('.card-deck');
const flashcard      = document.getElementById('flashcard');
const artiFrontEl    = document.getElementById('artiFront');
const furiganaBackEl = document.getElementById('furiganaBack');
const progressFill   = document.getElementById('progressFill');
const progressCount  = document.getElementById('progressCount');
const prevBtn        = document.getElementById('prevBtn');
const nextBtn        = document.getElementById('nextBtn');

/* ── FETCH DATA ── */
async function initFlashcards() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Gagal memuat data flashcard.');
    
    cards = await response.json();

    if (cards && cards.length > 0) {
      renderCard();
      bindEvents();
    } else {
      if (artiFrontEl) artiFrontEl.textContent = 'Data kosong.';
    }
  } catch (error) {
    console.error('Error:', error);
    if (artiFrontEl) artiFrontEl.textContent = 'Gagal memuat data. Pastikan data.json tersedia.';
  }
}

/* ── RENDER ── */
function renderCard() {
  if (cards.length === 0) return;
  const c = cards[currentIndex];

  if (artiFrontEl) artiFrontEl.textContent = c.arti || '';
  if (furiganaBackEl) furiganaBackEl.textContent = c.furigana || '';

  if (progressCount) progressCount.textContent = `${currentIndex + 1} / ${cards.length}`;
  if (progressFill) progressFill.style.width  = `${((currentIndex + 1) / cards.length) * 100}%`;

  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex === cards.length - 1;
}

/* ── FLIP ── */
function flipCard() {
  if (isAnimating) return;
  isFlipped = !isFlipped;
  flashcard.classList.toggle('is-flipped', isFlipped);
}

/* ── NAVIGATION with slide animation & safety fallback ── */
function goTo(direction) {
  // direction: 1 = next, -1 = prev
  if (isAnimating || cards.length === 0) return;
  const target = currentIndex + direction;
  if (target < 0 || target > cards.length - 1) return;

  isAnimating = true;
  isFlipped = false;
  flashcard.classList.remove('is-flipped');

  const outClass = direction === 1 ? 'sliding-next' : 'sliding-prev';
  const inClass  = direction === 1 ? 'entering-next' : 'entering-prev';

  // Penanganan jika CSS animation dimatikan/diabaikan browser mobile
  const supportsAnimation = window.getComputedStyle(flashcard).animationName !== 'none';

  if (!supportsAnimation) {
    currentIndex = target;
    renderCard();
    isAnimating = false;
    return;
  }

  cardDeck.classList.add(outClass);

  let fallbackTimeout;

  const handleOutEnd = (e) => {
    if (e && e.target !== flashcard) return;
    flashcard.removeEventListener('animationend', handleOutEnd);
    clearTimeout(fallbackTimeout);

    cardDeck.classList.remove(outClass);

    currentIndex = target;
    renderCard();

    cardDeck.classList.add(inClass);

    const handleInEnd = (eIn) => {
      if (eIn && eIn.target !== flashcard) return;
      flashcard.removeEventListener('animationend', handleInEnd);
      cardDeck.classList.remove(inClass);
      isAnimating = false;
    };

    flashcard.addEventListener('animationend', handleInEnd);

    // Timeout pengaman 500ms agar tombol tidak macet jika event lepas
    setTimeout(() => {
      cardDeck.classList.remove(inClass);
      isAnimating = false;
    }, 500);
  };

  flashcard.addEventListener('animationend', handleOutEnd);

  // Timeout pengaman fase keluar
  fallbackTimeout = setTimeout(() => {
    flashcard.removeEventListener('animationend', handleOutEnd);
    cardDeck.classList.remove(outClass);
    currentIndex = target;
    renderCard();
    isAnimating = false;
  }, 400);
}

/* ── BIND EVENTS ── */
function bindEvents() {
  // Event Klik & Keyboard
  flashcard.addEventListener('click', flipCard);
  
  flashcard.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      flipCard();
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(1);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      flipCard();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      goTo(-1);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      goTo(1);
    }
  });

  /* ── DUKUNGAN SWIPE SENTUHAN HP ── */
  flashcard.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  flashcard.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Deteksi jika pengguna melakukan swipe mendatar (bukan scroll halaman)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0) {
        goTo(1);  // Swipe ke kiri -> Next
      } else {
        goTo(-1); // Swipe ke kanan -> Prev
      }
    }
  }, { passive: true });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', initFlashcards);
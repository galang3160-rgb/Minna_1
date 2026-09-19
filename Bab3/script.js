/* =========================================================
   SOUMATOME — Flashcard Logic (Dynamic Fetch Data)
   ========================================================= */

/* ── STATE ── */
let cards = [];
let currentIndex = 0;
let isFlipped = false;
let isAnimating = false;

/* ── DOM REFS ── */
const cardDeck       = document.getElementById('cardStage').querySelector('.card-deck');
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

  artiFrontEl.textContent = c.arti || '';
  if (furiganaBackEl) {
    furiganaBackEl.textContent = c.furigana || '';
  }

  progressCount.textContent = `${currentIndex + 1} / ${cards.length}`;
  progressFill.style.width  = `${((currentIndex + 1) / cards.length) * 100}%`;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === cards.length - 1;
}

/* ── FLIP ── */
function flipCard() {
  if (isAnimating) return;
  isFlipped = !isFlipped;
  flashcard.classList.toggle('is-flipped', isFlipped);
}

/* ── NAVIGATION with slide animation ── */
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

  cardDeck.classList.add(outClass);

  const handleOutEnd = () => {
    flashcard.removeEventListener('animationend', handleOutEnd);
    cardDeck.classList.remove(outClass);

    currentIndex = target;
    renderCard();

    cardDeck.classList.add(inClass);
    const handleInEnd = () => {
      flashcard.removeEventListener('animationend', handleInEnd);
      cardDeck.classList.remove(inClass);
      isAnimating = false;
    };
    flashcard.addEventListener('animationend', handleInEnd);
  };

  flashcard.addEventListener('animationend', handleOutEnd);
}

/* ── BIND EVENTS ── */
function bindEvents() {
  flashcard.addEventListener('click', flipCard);
  flashcard.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      flipCard();
    }
  });

  prevBtn.addEventListener('click', () => goTo(-1));
  nextBtn.addEventListener('click', () => goTo(1));

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
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', initFlashcards);
/* =========================================================
   SOUMATOME — Flashcard Logic (Dynamic Fetch Data & Touch Support)
   + Fitur: Acak (shuffle) & Latihan Soal (practice quiz)
   ========================================================= */

/* ── STATE: FLASHCARD ── */
let cards = [];
let currentIndex = 0;
let isFlipped = false;
let isAnimating = false;

/* Touch Swipe Variables */
let touchStartX = 0;
let touchStartY = 0;

/* ── STATE: LATIHAN SOAL ── */
let practiceQuestions = [];
let practiceIndex = 0;
let practiceScore = 0;
let practiceAnswered = false;
let practiceMode = 'mc'; // 'mc' (pilihan ganda) | 'typing' (mengetik)
const PRACTICE_MAX_QUESTIONS = Infinity;
const PRACTICE_MAX_OPTIONS = 4;

/* ── DOM REFS: FLASHCARD ── */
const cardDeck       = document.getElementById('cardStage')?.querySelector('.card-deck');
const flashcard      = document.getElementById('flashcard');
const artiFrontEl    = document.getElementById('artiFront');
const furiganaBackEl = document.getElementById('furiganaBack');
const progressFill   = document.getElementById('progressFill');
const progressCount  = document.getElementById('progressCount');
const prevBtn        = document.getElementById('prevBtn');
const nextBtn        = document.getElementById('nextBtn');

/* ── DOM REFS: TOOLBAR & VIEWS ── */
const shuffleBtn      = document.getElementById('shuffleBtn');
const practiceBtn     = document.getElementById('practiceBtn');
const practiceBackBtn = document.getElementById('practiceBackBtn');
const flashcardView   = document.getElementById('flashcardView');
const practiceView    = document.getElementById('practiceView');

/* ── DOM REFS: LATIHAN SOAL ── */
const practiceProgressFill  = document.getElementById('practiceProgressFill');
const practiceProgressCount = document.getElementById('practiceProgressCount');
const practiceQuestionText  = document.getElementById('practiceQuestionText');
const practiceOptionsWrap   = document.getElementById('practiceOptions');
const practiceOptionButtons = practiceOptionsWrap
  ? Array.from(practiceOptionsWrap.querySelectorAll('.option-btn'))
  : [];
const practiceFeedback  = document.getElementById('practiceFeedback');
const practiceSkipBtn   = document.getElementById('practiceSkipBtn');
const practiceNextBtn   = document.getElementById('practiceNextBtn');
const practiceBody      = document.getElementById('practiceBody');
const practiceResult    = document.getElementById('practiceResult');
const practiceScoreText = document.getElementById('practiceScoreText');
const practiceRetryBtn  = document.getElementById('practiceRetryBtn');
const practiceExitBtn   = document.getElementById('practiceExitBtn');

/* ── DOM REFS: PILIH MODE & LATIHAN MENGETIK (fitur baru) ── */
const practiceModeSelect   = document.getElementById('practiceModeSelect');
const practiceModeMcBtn    = document.getElementById('practiceModeMcBtn');
const practiceModeTypeBtn  = document.getElementById('practiceModeTypeBtn');
const practiceQuizArea     = document.getElementById('practiceQuizArea');
const practiceTypeForm     = document.getElementById('practiceTypeAnswer');
const practiceTypeInput    = document.getElementById('practiceTypeInput');
const practiceTypeSubmit   = document.getElementById('practiceTypeSubmitBtn');

/* ── FETCH DATA ── */
async function initFlashcards() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Gagal memuat data flashcard.');

    cards = await response.json();

    if (cards && cards.length > 0) {
      renderCard();
      bindEvents();
      updateToolbarAvailability();
    } else {
      if (artiFrontEl) artiFrontEl.textContent = 'Data kosong.';
    }
  } catch (error) {
    console.error('Error:', error);
    if (artiFrontEl) artiFrontEl.textContent = 'Gagal memuat data. Pastikan data.json tersedia.';
  }
}

/* Nonaktifkan tombol Acak/Latihan Soal jika data tidak cukup untuk fitur itu */
function updateToolbarAvailability() {
  if (shuffleBtn) shuffleBtn.disabled = cards.length < 2;
  if (practiceBtn) practiceBtn.disabled = cards.length < 2;
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

  // PENTING: tambahkan class dulu, baru cek apakah animasinya aktif.
  // Animasi didefinisikan lewat selector ".card-deck.sliding-next .flashcard",
  // jadi kalau class belum ada saat dicek, browser selalu melaporkan 'none'.
  cardDeck.classList.add(outClass);

  // Paksa reflow supaya getComputedStyle di bawah membaca style terbaru,
  // bukan style lama sebelum class ditambahkan.
  void flashcard.offsetWidth;

  const cs = window.getComputedStyle(flashcard);
  const supportsAnimation = cs.animationName !== 'none' && cs.animationDuration !== '0s';

  // Kondisi ini pada praktiknya hanya true saat prefers-reduced-motion aktif
  // (CSS men-set animation: none !important di sana).
  if (!supportsAnimation) {
    cardDeck.classList.remove(outClass);
    currentIndex = target;
    renderCard();
    isAnimating = false;
    return;
  }

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

    // Timeout pengaman agar tombol tidak macet jika event animationend lepas
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

/* ── UTIL: FISHER-YATES SHUFFLE ──
   Mengembalikan array BARU yang teracak, tidak mengubah array asli. */
function shuffleArray(arr) {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/* ── FITUR: ACAK ──
   Mengacak urutan seluruh kartu, kembali ke kartu pertama, lalu tampilkan
   dengan animasi masuk yang sama seperti animasi navigasi kartu. */
function handleShuffle() {
  if (isAnimating || cards.length < 2) return;

  isFlipped = false;
  flashcard.classList.remove('is-flipped');

  cards = shuffleArray(cards);
  currentIndex = 0;

  playShuffleAnimation();
}

/* Reuse animasi "entering-next" yang sudah ada di CSS sebagai efek visual
   sesaat setelah kartu diacak, supaya perubahan terasa jelas ke pengguna. */
function playShuffleAnimation() {
  if (!cardDeck || !flashcard) {
    renderCard();
    return;
  }

  isAnimating = true;
  renderCard();

  const inClass = 'entering-next';
  cardDeck.classList.add(inClass);
  void flashcard.offsetWidth;

  const cs = window.getComputedStyle(flashcard);
  const supportsAnimation = cs.animationName !== 'none' && cs.animationDuration !== '0s';

  if (!supportsAnimation) {
    cardDeck.classList.remove(inClass);
    isAnimating = false;
    return;
  }

  const handleEnd = (e) => {
    if (e && e.target !== flashcard) return;
    flashcard.removeEventListener('animationend', handleEnd);
    cardDeck.classList.remove(inClass);
    isAnimating = false;
  };

  flashcard.addEventListener('animationend', handleEnd);

  // Timeout pengaman
  setTimeout(() => {
    flashcard.removeEventListener('animationend', handleEnd);
    cardDeck.classList.remove(inClass);
    isAnimating = false;
  }, 450);
}

/* ── FITUR: LATIHAN SOAL ── */

function isPracticeViewActive() {
  return !!practiceView && !practiceView.hidden;
}

/* Menyusun daftar soal pilihan ganda dari data kartu yang ada.
   Setiap soal: tampilkan furigana (bacaan Jepang), pengguna memilih arti
   Bahasa Indonesia yang benar dari beberapa pilihan. */
function buildPracticeQuestions() {
  const pool = shuffleArray(cards).filter(c => c.furigana && c.arti);
  const total = Math.min(PRACTICE_MAX_QUESTIONS, pool.length);
  const selected = pool.slice(0, total);

  const allAnswers = cards.map(c => c.arti).filter(Boolean);
  const optionCount = Math.min(PRACTICE_MAX_OPTIONS, allAnswers.length);

  return selected.map((c) => {
    const distractorPool = shuffleArray(
      allAnswers.filter(a => a !== c.arti)
    );
    const distractors = distractorPool.slice(0, Math.max(optionCount - 1, 0));
    const options = shuffleArray([c.arti, ...distractors]);

    return {
      question: c.furigana,
      correctAnswer: c.arti,
      options
    };
  });
}

function switchToView(view) {
  const showingPractice = view === 'practice';

  if (flashcardView) {
    flashcardView.hidden = showingPractice;
    flashcardView.setAttribute('aria-hidden', String(showingPractice));
  }
  if (practiceView) {
    practiceView.hidden = !showingPractice;
    practiceView.setAttribute('aria-hidden', String(!showingPractice));
  }
  if (practiceBtn) {
    practiceBtn.setAttribute('aria-expanded', String(showingPractice));
  }
}

/* Menampilkan layar pilih jenis latihan (Pilihan Ganda / Mengetik).
   Dipanggil saat tombol "Latihan Soal" di toolbar ditekan. */
function openPracticeModeSelect() {
  if (cards.length < 2) return;

  if (practiceModeSelect) practiceModeSelect.hidden = false;
  if (practiceQuizArea) practiceQuizArea.hidden = true;
  if (practiceResult) practiceResult.hidden = true;

  switchToView('practice');
}

function startPractice(mode) {
  if (cards.length < 2) return;

  practiceMode = mode === 'typing' ? 'typing' : 'mc';

  practiceQuestions = buildPracticeQuestions();
  practiceIndex = 0;
  practiceScore = 0;

  if (practiceQuestions.length === 0) return;

  if (practiceModeSelect) practiceModeSelect.hidden = true;
  if (practiceResult) practiceResult.hidden = true;
  setPracticeQuizVisible(true);

  switchToView('practice');
  renderPracticeQuestion();
}

function closePractice() {
  switchToView('flashcard');
}

function setPracticeQuizVisible(visible) {
  if (practiceQuizArea) practiceQuizArea.hidden = !visible;
}

/* Menampilkan UI jawaban sesuai mode aktif: pilihan ganda ATAU mengetik. */
function renderPracticeAnswerUI(q) {
  const showMc = practiceMode === 'mc';

  if (practiceOptionsWrap) practiceOptionsWrap.hidden = !showMc;
  if (practiceTypeForm) practiceTypeForm.hidden = showMc;

  if (showMc) {
    practiceOptionButtons.forEach((btn, i) => {
      const label = q.options[i];
      if (label === undefined) {
        btn.hidden = true;
        return;
      }
      btn.hidden = false;
      btn.textContent = label;
      btn.disabled = false;
      btn.classList.remove('is-correct', 'is-wrong');
      btn.dataset.answer = label;
    });
  } else if (practiceTypeInput) {
    practiceTypeInput.value = '';
    practiceTypeInput.disabled = false;
    practiceTypeInput.classList.remove('is-correct', 'is-wrong');
    if (practiceTypeSubmit) practiceTypeSubmit.disabled = false;
    // Fokus otomatis ke input supaya pengguna bisa langsung mengetik.
    practiceTypeInput.focus();
  }
}

function renderPracticeQuestion() {
  const total = practiceQuestions.length;

  if (practiceIndex >= total) {
    showPracticeResult();
    return;
  }

  practiceAnswered = false;

  const q = practiceQuestions[practiceIndex];

  if (practiceQuestionText) practiceQuestionText.textContent = q.question;

  renderPracticeAnswerUI(q);

  if (practiceFeedback) practiceFeedback.textContent = '';
  if (practiceNextBtn) practiceNextBtn.disabled = true;
  if (practiceSkipBtn) practiceSkipBtn.disabled = false;

  if (practiceProgressCount) {
    practiceProgressCount.textContent = `${practiceIndex + 1} / ${total}`;
  }
  if (practiceProgressFill) {
    practiceProgressFill.style.width = `${((practiceIndex + 1) / total) * 100}%`;
  }
}

/* Menyamakan format jawaban ketikan supaya perbandingan tidak terlalu kaku:
   huruf besar/kecil dan spasi berlebih diabaikan. */
function normalizeTypedAnswer(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function handlePracticeTypeSubmit(e) {
  e.preventDefault();
  if (practiceAnswered || !practiceTypeInput) return;

  practiceAnswered = true;
  const q = practiceQuestions[practiceIndex];
  const typedRaw = practiceTypeInput.value;
  const isCorrect = normalizeTypedAnswer(typedRaw) === normalizeTypedAnswer(q.correctAnswer);

  practiceTypeInput.disabled = true;
  if (practiceTypeSubmit) practiceTypeSubmit.disabled = true;

  if (isCorrect) {
    practiceScore++;
    practiceTypeInput.classList.add('is-correct');
    if (practiceFeedback) practiceFeedback.textContent = 'Benar! 🎉';
  } else {
    practiceTypeInput.classList.add('is-wrong');
    if (practiceFeedback) {
      practiceFeedback.textContent = `Kurang tepat. Jawaban benar: ${q.correctAnswer}`;
    }
  }

  if (practiceSkipBtn) practiceSkipBtn.disabled = true;
  if (practiceNextBtn) practiceNextBtn.disabled = false;
}

function handlePracticeOptionClick(e) {
  const btn = e.target.closest('.option-btn');
  if (!btn || practiceAnswered || btn.hidden) return;

  practiceAnswered = true;
  const q = practiceQuestions[practiceIndex];
  const chosen = btn.dataset.answer;
  const isCorrect = chosen === q.correctAnswer;

  if (isCorrect) {
    practiceScore++;
    btn.classList.add('is-correct');
    if (practiceFeedback) practiceFeedback.textContent = 'Benar! 🎉';
  } else {
    btn.classList.add('is-wrong');
    if (practiceFeedback) {
      practiceFeedback.textContent = `Kurang tepat. Jawaban benar: ${q.correctAnswer}`;
    }
    const correctBtn = practiceOptionButtons.find(
      (b) => b.dataset.answer === q.correctAnswer
    );
    if (correctBtn) correctBtn.classList.add('is-correct');
  }

  practiceOptionButtons.forEach((b) => { b.disabled = true; });
  if (practiceSkipBtn) practiceSkipBtn.disabled = true;
  if (practiceNextBtn) practiceNextBtn.disabled = false;
}

function handlePracticeNext() {
  if (practiceIndex >= practiceQuestions.length) return;
  practiceIndex++;
  renderPracticeQuestion();
}

function handlePracticeSkip() {
  if (practiceAnswered) return;
  practiceIndex++;
  renderPracticeQuestion();
}

function showPracticeResult() {
  setPracticeQuizVisible(false);

  if (practiceResult) practiceResult.hidden = false;
  if (practiceScoreText) {
    practiceScoreText.textContent = `${practiceScore} / ${practiceQuestions.length} benar`;
  }
  if (practiceProgressCount) {
    practiceProgressCount.textContent = `${practiceQuestions.length} / ${practiceQuestions.length}`;
  }
  if (practiceProgressFill) {
    practiceProgressFill.style.width = '100%';
  }
}

function handlePracticeRetry() {
  startPractice(practiceMode);
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
    // Nonaktifkan shortcut navigasi flashcard saat sedang berada
    // di halaman Latihan Soal, supaya tidak bentrok.
    if (isPracticeViewActive()) return;

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

  /* ── TOOLBAR: ACAK & LATIHAN SOAL ── */
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', handleShuffle);
  }

  if (practiceBtn) {
    // Sekarang membuka layar pilih jenis latihan dulu, bukan langsung
    // memulai sesi pilihan ganda seperti sebelumnya.
    practiceBtn.addEventListener('click', openPracticeModeSelect);
  }

  if (practiceBackBtn) {
    practiceBackBtn.addEventListener('click', closePractice);
  }

  if (practiceModeMcBtn) {
    practiceModeMcBtn.addEventListener('click', () => startPractice('mc'));
  }

  if (practiceModeTypeBtn) {
    practiceModeTypeBtn.addEventListener('click', () => startPractice('typing'));
  }

  if (practiceOptionsWrap) {
    practiceOptionsWrap.addEventListener('click', handlePracticeOptionClick);
  }

  if (practiceTypeForm) {
    practiceTypeForm.addEventListener('submit', handlePracticeTypeSubmit);
  }

  if (practiceNextBtn) {
    practiceNextBtn.addEventListener('click', handlePracticeNext);
  }

  if (practiceSkipBtn) {
    practiceSkipBtn.addEventListener('click', handlePracticeSkip);
  }

  if (practiceRetryBtn) {
    practiceRetryBtn.addEventListener('click', handlePracticeRetry);
  }

  if (practiceExitBtn) {
    practiceExitBtn.addEventListener('click', closePractice);
  }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', initFlashcards);
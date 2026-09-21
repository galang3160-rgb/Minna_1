/* =========================================================
   SOUMATOME — Dynamic Chapter Grid Script
   ========================================================= */

const chapters = [
  { id: 1, title: "Bab 1", subtitle: "Ready", isAvailable: true, link: "Bab1/index.html" },
  { id: 2, title: "Bab 2", subtitle: "Ready", isAvailable: true, link: "Bab2/index.html" },
  { id: 3, title: "Bab 3", subtitle: "Ready", isAvailable: true, link: "Bab3/index.html" },
  { id: 4, title: "Bab 4", subtitle: "Ready", isAvailable: true, link: "Bab4/index.html" },
  { id: 5, title: "Bab 5", subtitle: "Ready", isAvailable: true, link: "Bab5/index.html" },
  { id: 6, title: "Bab 6", subtitle: "Ready", isAvailable: true, link: "Bab6/index.html" },
  { id: 7, title: "Bab 7", subtitle: "Ready", isAvailable: true, link: "Bab7/index.html" },
  { id: 8, title: "Bab 8", subtitle: "Ready", isAvailable: true, link: "Bab8/index.html" },
  { id: 9, title: "Bab 9", subtitle: "Ready", isAvailable: true, link: "Bab9/index.html" },
  { id: 10, title: "Bab 10", subtitle: "Ready", isAvailable: true, link: "Bab10/index.html" },
  { id: 11, title: "Bab 11", subtitle: "Ready", isAvailable: true, link: "Bab11/index.html" },
  { id: 12, title: "Bab 12", subtitle: "Ready", isAvailable: true, link: "Bab12/index.html" },
  { id: 13, title: "Bab 13", subtitle: "Ready", isAvailable: true, link: "Bab13/index.html" },
  { id: 14, title: "Bab 14", subtitle: "Ready", isAvailable: true, link: "Bab14/index.html" },
  { id: 15, title: "Bab 15", subtitle: "Ready", isAvailable: true, link: "Bab15/index.html" },
  { id: 16, title: "Bab 16", subtitle: "Ready", isAvailable: true, link: "Bab16/index.html" },
  { id: 17, title: "Bab 17", subtitle: "Ready", isAvailable: true, link: "Bab17/index.html" },
  { id: 18, title: "Bab 18", subtitle: "Ready", isAvailable: true, link: "Bab18/index.html" },
  { id: 19, title: "Bab 19", subtitle: "Ready", isAvailable: true, link: "Bab19/index.html" },
  { id: 20, title: "Bab 20", subtitle: "Ready", isAvailable: true, link: "Bab20/index.html" },
  { id: 21, title: "Bab 21", subtitle: "Ready", isAvailable: true, link: "Bab21/index.html" },
  { id: 22, title: "Bab 22", subtitle: "Ready", isAvailable: true, link: "Bab22/index.html" },
  { id: 23, title: "Bab 23", subtitle: "Ready", isAvailable: true, link: "Bab23/index.html" },
  { id: 24, title: "Bab 24", subtitle: "Ready", isAvailable: true, link: "Bab24/index.html" },
  { id: 25, title: "Bab 25", subtitle: "Ready", isAvailable: true, link: "Bab25/index.html" },
];

function renderChapters() {
  const gridContainer = document.getElementById('chapterGrid');
  if (!gridContainer) return;

  // Jika kontainer kosong, render dari array chapters
  if (gridContainer.children.length === 0) {
    chapters.forEach(ch => {
      const card = document.createElement('a');
      card.href = ch.link;
      card.className = 'chapter-card active';
      card.innerHTML = `
        <div class="card-left-content">
          <div class="card-mini-bar">
            <div class="card-mini-bar-fill"></div>
          </div>
          <h2 class="card-title">${ch.title}</h2>
          <p class="card-desc">${ch.subtitle}</p>
        </div>
        <div class="glass-action-btn">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
      gridContainer.appendChild(card);
    });
  }
}

document.addEventListener('DOMContentLoaded', renderChapters);
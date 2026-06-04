const moods = {
  positive: {
    label: 'Положительное',
    hint: 'Зелёный кристалл для бодрого дня',
    fill: '#28d76d',
    stroke: '#0f9d49',
    glow: 'rgba(40, 215, 109, 0.45)',
  },
  neutral: {
    label: 'Нейтральное',
    hint: 'Оранжевый кристалл для спокойного настроя',
    fill: '#ff9f1a',
    stroke: '#d67000',
    glow: 'rgba(255, 159, 26, 0.42)',
  },
  bad: {
    label: 'Плохое',
    hint: 'Красный кристалл, когда день не задался',
    fill: '#ff4d4d',
    stroke: '#c52828',
    glow: 'rgba(255, 77, 77, 0.45)',
  },
  delightful: {
    label: 'Восхитительное',
    hint: 'Серебристый кристалл для особенного дня',
    fill: '#d9e2ec',
    stroke: '#8ea0ad',
    glow: 'rgba(217, 226, 236, 0.6)',
  },
};

let currentMoodKey = 'positive';
let imageUrl = '';

const app = document.querySelector('#root');

app.innerHTML = `
  <main class="app-shell">
    <section class="hero">
      <div>
        <p class="eyebrow">MVP · mood overlay</p>
        <h1>Добавьте кристалл настроения к фотографии</h1>
        <p class="intro">
          Загрузите портрет, выберите настроение дня — и приложение поставит над человеком кристалл в стиле life-sim.
        </p>
      </div>
      ${createPlumbobMarkup('hero-plumbob', true)}
    </section>

    <section class="workspace" aria-label="Редактор фотографии">
      <aside class="panel controls">
        <label class="upload-card">
          <span class="upload-title">Фото</span>
          <span class="upload-name" id="upload-name">Выберите фото</span>
          <input id="photo-input" type="file" accept="image/*" />
        </label>

        <div class="mood-list" id="mood-list" role="radiogroup" aria-label="Настроение дня"></div>

        <button class="download" id="download-button" type="button" disabled>Скачать PNG</button>
      </aside>

      <section class="panel preview-card">
        <div class="preview-stage" id="preview-stage">
          <div class="empty-state">
            ${createPlumbobMarkup('preview-plumbob')}
            <p>Здесь появится ваша фотография с кристаллом.</p>
          </div>
        </div>
        <p class="caption">Текущее настроение: <strong id="caption-mood">${moods[currentMoodKey].label}</strong></p>
      </section>
    </section>
  </main>
`;

const moodList = document.querySelector('#mood-list');
const uploadName = document.querySelector('#upload-name');
const photoInput = document.querySelector('#photo-input');
const previewStage = document.querySelector('#preview-stage');
const downloadButton = document.querySelector('#download-button');
const captionMood = document.querySelector('#caption-mood');

renderMoodButtons();
applyMoodStyles();

photoInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
  }

  imageUrl = URL.createObjectURL(file);
  uploadName.textContent = file.name;
  downloadButton.disabled = false;
  renderPreview();
});

downloadButton.addEventListener('click', downloadResult);

function renderMoodButtons() {
  moodList.innerHTML = Object.entries(moods)
    .map(([key, mood]) => `
      <button
        type="button"
        class="${key === currentMoodKey ? 'mood-button active' : 'mood-button'}"
        data-mood="${key}"
        aria-pressed="${key === currentMoodKey}"
      >
        <span class="swatch" style="background: ${mood.fill}"></span>
        <span>
          <strong>${mood.label}</strong>
          <small>${mood.hint}</small>
        </span>
      </button>
    `)
    .join('');

  moodList.querySelectorAll('.mood-button').forEach((button) => {
    button.addEventListener('click', () => {
      currentMoodKey = button.dataset.mood;
      renderMoodButtons();
      applyMoodStyles();
      captionMood.textContent = moods[currentMoodKey].label;
    });
  });
}

function renderPreview() {
  previewStage.innerHTML = `
    <div class="photo-frame">
      ${createPlumbobMarkup('preview-plumbob')}
      <img id="preview-image" src="${imageUrl}" alt="Загруженная фотография" />
    </div>
  `;
  applyMoodStyles();
}

function applyMoodStyles() {
  const mood = moods[currentMoodKey];
  document.querySelectorAll('.plumbob').forEach((plumbob) => {
    plumbob.style.setProperty('--fill', mood.fill);
    plumbob.style.setProperty('--stroke', mood.stroke);
    plumbob.style.setProperty('--glow', mood.glow);
  });
}

async function downloadResult() {
  const image = document.querySelector('#preview-image');
  if (!image || !imageUrl) return;

  if (!image.complete) {
    await image.decode();
  }

  const canvas = document.createElement('canvas');
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);
  drawPlumbob(context, width, height, moods[currentMoodKey]);

  const link = document.createElement('a');
  link.download = `mood-crystal-${currentMoodKey}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function createPlumbobMarkup(id, compact = false) {
  return `
    <div id="${id}" class="${compact ? 'plumbob compact' : 'plumbob'}" aria-hidden="true">
      <div class="diamond top"></div>
      <div class="diamond bottom"></div>
      <div class="shine"></div>
    </div>
  `;
}

function drawPlumbob(context, canvasWidth, canvasHeight, mood) {
  const centerX = canvasWidth / 2;
  const topY = Math.max(canvasHeight * 0.04, 24);
  const crystalHeight = Math.min(canvasHeight * 0.26, canvasWidth * 0.28, 220);
  const crystalWidth = crystalHeight * 0.42;
  const midY = topY + crystalHeight * 0.48;
  const bottomY = topY + crystalHeight;

  context.save();
  context.shadowColor = mood.glow;
  context.shadowBlur = crystalHeight * 0.18;
  context.lineWidth = Math.max(4, crystalHeight * 0.035);
  context.strokeStyle = mood.stroke;
  context.fillStyle = mood.fill;

  context.beginPath();
  context.moveTo(centerX, topY);
  context.lineTo(centerX + crystalWidth, midY);
  context.lineTo(centerX, bottomY);
  context.lineTo(centerX - crystalWidth, midY);
  context.closePath();
  context.fill();
  context.stroke();

  const gradient = context.createLinearGradient(centerX - crystalWidth, topY, centerX + crystalWidth, bottomY);
  gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.32, 'rgba(255,255,255,0.22)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.18)');
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();
  context.moveTo(centerX, topY + crystalHeight * 0.14);
  context.lineTo(centerX + crystalWidth * 0.36, midY);
  context.lineTo(centerX, bottomY - crystalHeight * 0.18);
  context.lineTo(centerX - crystalWidth * 0.12, midY);
  context.closePath();
  context.fillStyle = 'rgba(255,255,255,0.22)';
  context.fill();
  context.restore();
}

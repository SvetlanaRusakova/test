const moods = {
  bad: {
    label: 'Плохое',
    shortLabel: 'Плохо',
    hint: 'Сложный день — красный кристалл',
    fill: '#ef4444',
    stroke: '#9f1239',
    dark: '#7f1d1d',
    light: '#fecaca',
    glow: 'rgba(239, 68, 68, 0.42)',
  },
  positive: {
    label: 'Положительное',
    shortLabel: 'Хорошо',
    hint: 'Тёплый настрой — зелёный кристалл',
    fill: '#22c55e',
    stroke: '#15803d',
    dark: '#14532d',
    light: '#bbf7d0',
    glow: 'rgba(34, 197, 94, 0.44)',
  },
  neutral: {
    label: 'Нейтральное',
    shortLabel: 'Норма',
    hint: 'Ровный день — жёлтый кристалл',
    fill: '#facc15',
    stroke: '#ca8a04',
    dark: '#854d0e',
    light: '#fef9c3',
    glow: 'rgba(250, 204, 21, 0.44)',
  },
  excellent: {
    label: 'Превосходное',
    shortLabel: 'Вау',
    hint: 'Лучший день — серебряный кристалл',
    fill: '#d9e2ec',
    stroke: '#94a3b8',
    dark: '#64748b',
    light: '#ffffff',
    glow: 'rgba(226, 232, 240, 0.62)',
  },
};

const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const today = new Date();
const visibleYear = today.getFullYear();
const visibleMonth = today.getMonth();
const todayDateKey = formatDateKey(today);
const storageKey = `mood-tracker:${visibleYear}-${String(visibleMonth + 1).padStart(2, '0')}`;

let currentMoodKey = localStorage.getItem('currentMoodKey') || 'positive';
let imageUrl = localStorage.getItem('uploadedPhoto') || '';
let monthMoods = readMonthMoods();

const app = document.querySelector('#root');

app.innerHTML = `
  <main class="app-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Daily mood tracker</p>
        <h1>Трекер настроения с кристаллом дня</h1>
        <p class="intro">
          Загрузи фотографию, отмечай настроение каждый день и смотри, как календарь месяца заполняется цветом.
          Кристалл над фото меняется вместе с выбранным настроением.
        </p>
      </div>
      <div class="hero-stats" aria-label="Краткая статистика месяца">
        <span class="stat-value" id="filled-days">0</span>
        <span class="stat-label">дней отмечено</span>
      </div>
    </section>

    <section class="dashboard" aria-label="Ежедневный трекер настроения">
      <section class="photo-card panel" aria-label="Фотография с кристаллом настроения">
        <div class="section-heading">
          <div>
            <p class="kicker">Фото дня</p>
            <h2>Кристалл над головой</h2>
          </div>
          <label class="change-photo">
            <span id="photo-action-label">${imageUrl ? 'Поменять фото' : 'Загрузить фото'}</span>
            <input id="photo-input" type="file" accept="image/*" />
          </label>
        </div>

        <div class="portrait-stage" id="portrait-stage">
          ${renderPhotoStage()}
        </div>

        <div class="mood-picker" id="mood-picker" role="radiogroup" aria-label="Выбор настроения на сегодня"></div>
      </section>

      <aside class="calendar-card panel" aria-label="Календарь текущего месяца">
        <div class="section-heading calendar-heading">
          <div>
            <p class="kicker">Текущий месяц</p>
            <h2 id="month-title">${capitalize(monthFormatter.format(today))}</h2>
          </div>
          <div class="today-pill">Сегодня · ${today.getDate()}</div>
        </div>

        <div class="calendar-weekdays" id="calendar-weekdays"></div>
        <div class="calendar-grid" id="calendar-grid"></div>

        <div class="legend" aria-label="Легенда настроений">
          ${Object.entries(moods)
            .map(([key, mood]) => `<span><i style="background:${mood.fill}"></i>${mood.shortLabel}</span>`)
            .join('')}
        </div>
      </aside>
    </section>
  </main>
`;

const photoInput = document.querySelector('#photo-input');
const photoActionLabel = document.querySelector('#photo-action-label');
const portraitStage = document.querySelector('#portrait-stage');
const moodPicker = document.querySelector('#mood-picker');
const calendarWeekdays = document.querySelector('#calendar-weekdays');
const calendarGrid = document.querySelector('#calendar-grid');
const filledDays = document.querySelector('#filled-days');

renderMoodPicker();
renderCalendar();
applyMoodStyles();
updateMonthStats();

photoInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  imageUrl = await fileToDataUrl(file);
  localStorage.setItem('uploadedPhoto', imageUrl);
  photoActionLabel.textContent = 'Поменять фото';
  portraitStage.innerHTML = renderPhotoStage();
  applyMoodStyles();
});

function renderPhotoStage() {
  if (!imageUrl) {
    return `
      <div class="empty-portrait">
        ${createPlumbobMarkup()}
        <div>
          <strong>Добавь фотографию</strong>
          <span>Кристалл появится над человеком, а фото можно будет заменить в любой момент.</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="portrait-frame">
      ${createPlumbobMarkup()}
      <img id="preview-image" src="${imageUrl}" alt="Загруженная фотография для трекера настроения" />
    </div>
  `;
}

function renderMoodPicker() {
  moodPicker.innerHTML = Object.entries(moods)
    .map(([key, mood]) => `
      <button
        class="${key === currentMoodKey ? 'mood-option active' : 'mood-option'}"
        type="button"
        data-mood="${key}"
        aria-pressed="${key === currentMoodKey}"
      >
        <span class="mood-orb" style="--orb:${mood.fill}; --orb-glow:${mood.glow}"></span>
        <span>
          <strong>${mood.label}</strong>
          <small>${mood.hint}</small>
        </span>
      </button>
    `)
    .join('');

  moodPicker.querySelectorAll('.mood-option').forEach((button) => {
    button.addEventListener('click', () => {
      currentMoodKey = button.dataset.mood;
      localStorage.setItem('currentMoodKey', currentMoodKey);
      monthMoods[todayDateKey] = currentMoodKey;
      saveMonthMoods();
      renderMoodPicker();
      renderCalendar();
      applyMoodStyles();
      updateMonthStats();
    });
  });
}

function renderCalendar() {
  calendarWeekdays.innerHTML = getWeekdays().map((day) => `<span>${day}</span>`).join('');

  const firstDay = new Date(visibleYear, visibleMonth, 1);
  const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
  const offset = normalizeWeekday(firstDay.getDay());
  const cells = [];

  for (let index = 0; index < offset; index += 1) {
    cells.push('<div class="day-cell muted" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(visibleYear, visibleMonth, day);
    const dateKey = formatDateKey(date);
    const moodKey = monthMoods[dateKey];
    const mood = moods[moodKey];
    const isToday = dateKey === todayDateKey;
    const style = mood ? `style="--day-color:${mood.fill}; --day-glow:${mood.glow}"` : '';
    const title = mood ? `${day}: ${mood.label}` : `${day}: настроение не выбрано`;

    cells.push(`
      <button
        class="day-cell ${mood ? 'filled' : ''} ${isToday ? 'today' : ''}"
        type="button"
        data-date="${dateKey}"
        ${style}
        title="${title}"
        aria-label="${title}"
      >
        <span>${day}</span>
      </button>
    `);
  }

  calendarGrid.innerHTML = cells.join('');

  calendarGrid.querySelectorAll('.day-cell[data-date]').forEach((button) => {
    button.addEventListener('click', () => {
      monthMoods[button.dataset.date] = currentMoodKey;
      saveMonthMoods();
      renderCalendar();
      updateMonthStats();
    });
  });
}

function applyMoodStyles() {
  const mood = moods[currentMoodKey];
  document.documentElement.style.setProperty('--active-mood', mood.fill);
  document.documentElement.style.setProperty('--active-mood-light', mood.light);
  document.documentElement.style.setProperty('--active-mood-dark', mood.dark);
  document.documentElement.style.setProperty('--active-mood-stroke', mood.stroke);
  document.documentElement.style.setProperty('--active-mood-glow', mood.glow);
}

function updateMonthStats() {
  filledDays.textContent = Object.keys(monthMoods).length;
}

function createPlumbobMarkup() {
  return `
    <div class="plumbob" aria-hidden="true">
      <div class="plumbob-shadow"></div>
      <div class="plumbob-top">
        <span class="facet facet-left"></span>
        <span class="facet facet-center"></span>
        <span class="facet facet-right"></span>
      </div>
      <div class="plumbob-bottom">
        <span class="facet facet-left"></span>
        <span class="facet facet-center"></span>
        <span class="facet facet-right"></span>
      </div>
      <span class="plumbob-spark spark-one"></span>
      <span class="plumbob-spark spark-two"></span>
    </div>
  `;
}

function readMonthMoods() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function saveMonthMoods() {
  localStorage.setItem(storageKey, JSON.stringify(monthMoods));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

function getWeekdays() {
  const baseMonday = new Date(2026, 5, 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseMonday);
    date.setDate(baseMonday.getDate() + index);
    return capitalize(weekdayFormatter.format(date).replace('.', ''));
  });
}

function normalizeWeekday(day) {
  return day === 0 ? 6 : day - 1;
}

function formatDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
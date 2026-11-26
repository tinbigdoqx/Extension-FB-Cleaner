const ALLOWED_HOSTS = new Set([
  'www.facebook.com',
  'web.facebook.com',
  'm.facebook.com',
  'business.facebook.com',
]);

const STORAGE_KEY = 'vhFbCleanerSettings';

const I18N = {
  km: {
    subtitle: 'សម្អាតផុស និងវីដេអូលើ Facebook',
    notFb: 'សូមបើកទំព័រ Facebook Page ឬ Profile ដែលអ្នកចង់សម្អាតជាមុនសិន។',
    connectErr: 'មិនអាចភ្ជាប់ទៅទំព័រ Facebook បានទេ — សូម Refresh ទំព័រ។',
    status: {
      idle: 'រង់ចាំ',
      running: 'កំពុងសម្អាត...',
      paused: 'បានផ្អាក',
      stopped: 'បានបញ្ឈប់',
      completed: 'បានបញ្ចប់',
      disabled: 'មិនមែន Facebook',
    },
    deleted: 'បានលុប',
    skipped: 'បានរំលង',
    errors: 'កំហុស',
    progress: 'វឌ្ឍនភាព',
    unlimited: 'លុបទាំងអស់',
    postsUnit: 'ផុស',
    modeTitle: 'ជ្រើសរើសប្រភេទសម្អាត (Action Mode)',
    modes: {
      remove_all: 'Remove ទាំងអស់',
      bin_only: 'ធុងសម្រាម',
      archive_only: 'Archive',
    },
    modeDesc: {
      remove_all: 'Bin + Delete + Remove/Hide',
      bin_only: 'Move to Bin / Delete',
      archive_only: 'Move to Archive',
    },
    limitLabel: 'កំណត់ចំនួន (០ = ទាំងអស់)',
    presetAll: 'ទាំងអស់',
    delayLabel: 'រង់ចាំ (វិនាទី)',
    autoScrollLabel: 'អូសទំព័រស្វ័យប្រវត្តិ',
    startRemoveAll: 'ចាប់ផ្តើម Remove ទាំងអស់',
    startLimit: 'ចាប់ផ្តើមសម្អាត',
    pause: 'ផ្អាក',
    resume: 'បន្ត',
    stop: 'បញ្ឈប់',
    reset: 'កំណត់ឡើងវិញ',
    logHeader: 'កំណត់ត្រាសកម្មភាព',
    logEmpty: 'មិនទាន់មានសកម្មភាពនៅឡើយទេ។',
    adminPrefix: 'Admin:',
    fbPageLink: 'Facebook',
    channelLink: 'Channel',
    footer: 'ផុសក្នុង Bin រក្សាទុក ៣០ ថ្ងៃ មុនលុបអចិន្ត្រៃយ៍។',
  },
  en: {
    subtitle: 'Auto Clean Posts, Videos & Tags',
    notFb: 'Please open a Facebook Page or Profile tab first to start cleaning.',
    connectErr: 'Could not connect to Facebook tab — please refresh the page.',
    status: {
      idle: 'Ready',
      running: 'Cleaning...',
      paused: 'Paused',
      stopped: 'Stopped',
      completed: 'Completed',
      disabled: 'Not Facebook',
    },
    deleted: 'Removed',
    skipped: 'Skipped',
    errors: 'Errors',
    progress: 'Progress',
    unlimited: 'Remove All',
    postsUnit: 'posts',
    modeTitle: 'Cleanup Mode',
    modes: {
      remove_all: 'Remove All',
      bin_only: 'Move to Bin',
      archive_only: 'Archive',
    },
    modeDesc: {
      remove_all: 'Bin + Delete + Remove/Hide',
      bin_only: 'Move to Bin / Delete',
      archive_only: 'Move to Archive',
    },
    limitLabel: 'Limit (0 = Remove All)',
    presetAll: 'All',
    delayLabel: 'Delay (sec)',
    autoScrollLabel: 'Auto Scroll',
    startRemoveAll: 'Remove All Posts',
    startLimit: 'Start Cleaning',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    reset: 'Reset',
    logHeader: 'Activity Log',
    logEmpty: 'No activity yet.',
    adminPrefix: 'Admin:',
    fbPageLink: 'Facebook',
    channelLink: 'Channel',
    footer: 'Posts moved to Bin remain recoverable for 30 days.',
  },
};

const els = {
  subtitleText: document.getElementById('subtitleText'),
  langKmBtn: document.getElementById('langKmBtn'),
  langEnBtn: document.getElementById('langEnBtn'),
  statusBadge: document.getElementById('statusBadge'),
  notFbWarning: document.getElementById('notFbWarning'),
  statDeletedLabel: document.getElementById('statDeletedLabel'),
  deletedCount: document.getElementById('deletedCount'),
  statSkippedLabel: document.getElementById('statSkippedLabel'),
  skippedCount: document.getElementById('skippedCount'),
  statErrorLabel: document.getElementById('statErrorLabel'),
  errorCount: document.getElementById('errorCount'),
  progressLabel: document.getElementById('progressLabel'),
  progressText: document.getElementById('progressText'),
  progressBar: document.getElementById('progressBar'),
  modeSectionLabel: document.getElementById('modeSectionLabel'),
  modeRemoveAll: document.getElementById('modeRemoveAll'),
  modeBinOnly: document.getElementById('modeBinOnly'),
  modeArchiveOnly: document.getElementById('modeArchiveOnly'),
  limitLabel: document.getElementById('limitLabel'),
  presetAll: document.getElementById('presetAll'),
  limitInput: document.getElementById('limitInput'),
  delayLabel: document.getElementById('delayLabel'),
  delayInput: document.getElementById('delayInput'),
  autoScrollLabel: document.getElementById('autoScrollLabel'),
  autoScrollInput: document.getElementById('autoScrollInput'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  stopBtn: document.getElementById('stopBtn'),
  resetBtn: document.getElementById('resetBtn'),
  logHeaderLabel: document.getElementById('logHeaderLabel'),
  modeIndicator: document.getElementById('modeIndicator'),
  logList: document.getElementById('logList'),
  adminPrefixText: document.getElementById('adminPrefixText'),
  fbPageLinkText: document.getElementById('fbPageLinkText'),
  channelLinkText: document.getElementById('channelLinkText'),
  footerNote: document.getElementById('footerNote'),
};

const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const presetButtons = Array.from(document.querySelectorAll('.preset-btn'));

let activeTabId = null;
let isFacebookTab = false;
let currentState = null;
let currentLang = 'en';
let selectedMode = 'remove_all';

function t() {
  return I18N[currentLang] || I18N.en;
}

function isAllowedFacebookUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'https:' && ALLOWED_HOSTS.has(parsed.hostname);
  } catch (_) {
    return false;
  }
}

function readSettingsFromInputs() {
  const limitRaw = parseInt(els.limitInput.value, 10);
  const delayRaw = parseFloat(els.delayInput.value);
  return {
    lang: currentLang,
    actionMode: selectedMode,
    limit: Number.isFinite(limitRaw) && limitRaw >= 0 ? limitRaw : 0,
    delaySec:
      Number.isFinite(delayRaw) ? Math.min(30, Math.max(1, delayRaw)) : 2.5,
    autoScroll: Boolean(els.autoScrollInput.checked),
  };
}

async function saveSettings() {
  const settings = readSettingsFromInputs();
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  } catch (_) {
    // Ignore storage write errors cleanly.
  }
}

async function loadSavedSettings() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const saved = result?.[STORAGE_KEY];
    if (!saved) return;

    if (saved.lang === 'km' || saved.lang === 'en') {
      currentLang = saved.lang;
    }
    if (['remove_all', 'bin_only', 'archive_only'].includes(saved.actionMode)) {
      selectedMode = saved.actionMode;
    }
    if (typeof saved.limit === 'number' && saved.limit >= 0) {
      els.limitInput.value = String(saved.limit);
    }
    if (typeof saved.delaySec === 'number' && saved.delaySec >= 1) {
      els.delayInput.value = String(saved.delaySec);
    }
    if (typeof saved.autoScroll === 'boolean') {
      els.autoScrollInput.checked = saved.autoScroll;
    }
  } catch (_) {
    // Keep defaults.
  }
}

function updatePresetHighlights() {
  const currentLimit = parseInt(els.limitInput.value, 10);
  for (const btn of presetButtons) {
    const target = parseInt(btn.dataset.limit, 10);
    btn.classList.toggle('active', currentLimit === target);
  }
}

function updateModeHighlights() {
  for (const btn of modeButtons) {
    btn.classList.toggle('active', btn.dataset.mode === selectedMode);
  }
}

function applyTranslations() {
  const dict = t();
  document.documentElement.lang = currentLang;

  els.langKmBtn.classList.toggle('active', currentLang === 'km');
  els.langEnBtn.classList.toggle('active', currentLang === 'en');

  els.subtitleText.textContent = dict.subtitle;
  els.statDeletedLabel.textContent = dict.deleted;
  els.statSkippedLabel.textContent = dict.skipped;
  els.statErrorLabel.textContent = dict.errors;
  els.progressLabel.textContent = dict.progress;
  els.modeSectionLabel.textContent = dict.modeTitle;
  els.modeRemoveAll.textContent = dict.modes.remove_all;
  els.modeBinOnly.textContent = dict.modes.bin_only;
  els.modeArchiveOnly.textContent = dict.modes.archive_only;
  els.limitLabel.textContent = dict.limitLabel;
  els.presetAll.textContent = dict.presetAll;
  els.delayLabel.textContent = dict.delayLabel;
  els.autoScrollLabel.textContent = dict.autoScrollLabel;
  els.stopBtn.textContent = dict.stop;
  els.resetBtn.textContent = dict.reset;
  els.logHeaderLabel.textContent = dict.logHeader;
  els.adminPrefixText.textContent = dict.adminPrefix;
  els.fbPageLinkText.textContent = dict.fbPageLink;
  els.channelLinkText.textContent = dict.channelLink;
  els.footerNote.textContent = dict.footer;
  els.modeIndicator.textContent = dict.modeDesc[selectedMode] || '';

  const limitNum = parseInt(els.limitInput.value, 10) || 0;
  els.startBtn.textContent =
    limitNum === 0 ? dict.startRemoveAll : dict.startLimit;

  updatePresetHighlights();
  updateModeHighlights();

  if (!isFacebookTab) {
    renderNotSupported();
  } else if (currentState) {
    renderState(currentState);
  } else {
    els.statusBadge.textContent = dict.status.idle;
    els.pauseBtn.textContent = dict.pause;
    renderLogs([]);
  }
}

async function sendToTab(message) {
  if (!activeTabId || !isFacebookTab) return null;

  try {
    return await chrome.tabs.sendMessage(activeTabId, message);
  } catch (_) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['content.js'],
      });
      return await chrome.tabs.sendMessage(activeTabId, message);
    } catch (_) {
      renderNotSupported(t().connectErr);
      return null;
    }
  }
}

function renderNotSupported(customMsg) {
  const dict = t();
  els.notFbWarning.classList.remove('hidden');
  els.notFbWarning.textContent = customMsg || dict.notFb;

  els.statusBadge.className = 'status-badge disabled';
  els.statusBadge.textContent = dict.status.disabled;

  els.startBtn.disabled = true;
  els.pauseBtn.disabled = true;
  els.stopBtn.disabled = true;
  els.resetBtn.disabled = true;
}

function renderLogs(logs = []) {
  const dict = t();
  els.logList.textContent = '';

  if (!logs.length) {
    const empty = document.createElement('div');
    empty.className = 'log-empty';
    empty.textContent = dict.logEmpty;
    els.logList.appendChild(empty);
    return;
  }

  for (const entry of logs) {
    const row = document.createElement('div');
    row.className = `log-item ${entry.level || 'info'}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${entry.time || '--:--:--'}]`;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent =
      entry[currentLang] || entry.message || entry.km || entry.en || '';

    row.appendChild(timeSpan);
    row.appendChild(msgSpan);
    els.logList.appendChild(row);
  }

  els.logList.scrollTop = els.logList.scrollHeight;
}

function renderProgress(state, isRunning) {
  const dict = t();
  const deleted = state.deletedCount || 0;
  const limit = state.limit || 0;

  if (limit > 0) {
    const pct = Math.min(100, Math.round((deleted / limit) * 100));
    els.progressText.textContent = `${deleted} / ${limit} (${pct}%)`;
    els.progressBar.classList.remove('indeterminate');
    els.progressBar.style.width = `${pct}%`;
  } else {
    els.progressText.textContent = `${deleted} ${dict.postsUnit} (${dict.unlimited})`;
    if (isRunning) {
      els.progressBar.classList.add('indeterminate');
    } else {
      els.progressBar.classList.remove('indeterminate');
      els.progressBar.style.width = deleted > 0 ? '100%' : '0%';
    }
  }
}

function renderState(state) {
  if (!state) return;
  currentState = state;
  const dict = t();

  const status = state.status || 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isActive = isRunning || isPaused;

  if (isActive && state.actionMode) {
    selectedMode = state.actionMode;
    updateModeHighlights();
    els.modeIndicator.textContent = dict.modeDesc[selectedMode] || '';
  }

  els.notFbWarning.classList.add('hidden');
  els.statusBadge.className = `status-badge ${status}`;
  els.statusBadge.textContent = dict.status[status] || dict.status.idle;

  els.deletedCount.textContent = String(state.deletedCount || 0);
  els.skippedCount.textContent = String(state.skippedCount || 0);
  els.errorCount.textContent = String(state.errorCount || 0);

  renderProgress(state, isRunning);

  els.limitInput.disabled = isActive;
  els.delayInput.disabled = isActive;
  els.autoScrollInput.disabled = isActive;
  for (const btn of modeButtons) btn.disabled = isActive;
  for (const btn of presetButtons) btn.disabled = isActive;

  els.startBtn.disabled = !isFacebookTab || isActive;
  els.pauseBtn.disabled = !isFacebookTab || !isActive;
  els.stopBtn.disabled = !isFacebookTab || !isActive;
  els.resetBtn.disabled = !isFacebookTab || isActive;

  if (isPaused) {
    els.pauseBtn.textContent = dict.resume;
    els.pauseBtn.className = 'btn btn-resume';
  } else {
    els.pauseBtn.textContent = dict.pause;
    els.pauseBtn.className = 'btn btn-warning';
  }

  renderLogs(state.logs || []);
}

async function switchLanguage(lang) {
  if (lang !== 'km' && lang !== 'en') return;
  currentLang = lang;
  await saveSettings();
  applyTranslations();
  if (isFacebookTab && activeTabId) {
    const state = await sendToTab({ type: 'SET_LANG', lang });
    if (state) renderState(state);
  }
}

function bindEvents() {
  els.langKmBtn.addEventListener('click', () => switchLanguage('km'));
  els.langEnBtn.addEventListener('click', () => switchLanguage('en'));

  for (const btn of modeButtons) {
    btn.addEventListener('click', () => {
      selectedMode = btn.dataset.mode;
      saveSettings();
      applyTranslations();
    });
  }

  for (const btn of presetButtons) {
    btn.addEventListener('click', () => {
      els.limitInput.value = btn.dataset.limit;
      saveSettings();
      applyTranslations();
    });
  }

  els.limitInput.addEventListener('input', () => {
    saveSettings();
    applyTranslations();
  });
  els.delayInput.addEventListener('change', saveSettings);
  els.autoScrollInput.addEventListener('change', saveSettings);

  els.startBtn.addEventListener('click', async () => {
    await saveSettings();
    const options = readSettingsFromInputs();
    const state = await sendToTab({ type: 'START', options });
    if (state) renderState(state);
  });

  els.pauseBtn.addEventListener('click', async () => {
    const action = currentState?.status === 'paused' ? 'RESUME' : 'PAUSE';
    const state = await sendToTab({ type: action });
    if (state) renderState(state);
  });

  els.stopBtn.addEventListener('click', async () => {
    const state = await sendToTab({ type: 'STOP' });
    if (state) renderState(state);
  });

  els.resetBtn.addEventListener('click', async () => {
    const state = await sendToTab({ type: 'RESET' });
    if (state) renderState(state);
  });

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (
      message?.type === 'STATE_UPDATE' &&
      sender?.tab?.id === activeTabId &&
      message.state
    ) {
      renderState(message.state);
    }
  });
}

async function init() {
  await loadSavedSettings();
  bindEvents();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !isAllowedFacebookUrl(tab.url || '')) {
    isFacebookTab = false;
    applyTranslations();
    return;
  }

  activeTabId = tab.id;
  isFacebookTab = true;
  applyTranslations();

  let state = await sendToTab({ type: 'GET_STATE' });
  if (state) {
    if (state.lang !== currentLang) {
      state = (await sendToTab({ type: 'SET_LANG', lang: currentLang })) || state;
    }
    renderState(state);
  }

  setInterval(async () => {
    if (!isFacebookTab || !activeTabId) return;
    try {
      const latest = await chrome.tabs.sendMessage(activeTabId, {
        type: 'GET_STATE',
      });
      if (latest) renderState(latest);
    } catch (_) {
      // Ignore transient errors while tab navigates.
    }
  }, 1200);
}

init();

(() => {
  if (window.__vhFbCleanerController?.isAlive?.()) return;

  // Clean up any legacy floating HUDs or previous controllers on extension reload.
  for (const legacyId of ['fb-auto-bin-hud-host', 'vh-fb-cleaner-hud-host']) {
    const legacyEl = document.getElementById(legacyId);
    if (legacyEl) legacyEl.remove();
  }
  window.__fbAutoMoveToBinController?.teardown?.();
  window.__vhFbCleanerController?.teardown?.();

  const STATUS = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPED: 'stopped',
    COMPLETED: 'completed',
    ERROR: 'error',
  };

  const MODE = {
    REMOVE_ALL: 'remove_all',
    BIN_ONLY: 'bin_only',
    ARCHIVE_ONLY: 'archive_only',
  };

  const PRIMARY_BIN_LABELS = [
    'move to bin',
    'move to trash',
    'ផ្លាស់ទីទៅធុងសម្រាម',
    'ដាក់ក្នុងធុងសម្រាម',
  ];

  const FALLBACK_DELETE_LABELS = [
    'delete post',
    'delete video',
    'delete photo',
    'delete reel',
    'delete',
    'លុបការបង្ហោះ',
    'លុបវីដេអូ',
    'លុបរូបភាព',
    'លុប reel',
    'លុប',
  ];

  const REMOVE_HIDE_LABELS = [
    'remove post',
    'remove video',
    'remove tag',
    'remove from profile',
    'remove from page',
    'remove',
    'hide from profile',
    'hide from timeline',
    'hide from page',
    'hide post',
    'ដកស្លាកចេញ',
    'ដកការបង្ហោះចេញ',
    'ដកចេញ',
    'លាក់ពីប្រវត្តិរូប',
    'លាក់ពីទំព័រ',
  ];

  const ARCHIVE_LABELS = [
    'move to archive',
    'archive',
    'ផ្លាស់ទីទៅប័ណ្ណសារ',
    'ដាក់ក្នុងប័ណ្ណសារ',
  ];

  const ALWAYS_IGNORE_LABELS = [
    'save video',
    'save post',
    'save reel',
    'pin post',
    'unpin post',
    'edit post',
    'edit date',
    'copy link',
    'embed',
  ];

  const CONFIRM_BUTTON_LABELS = [
    'move',
    'move to bin',
    'move to trash',
    'move to archive',
    'archive',
    'delete',
    'delete post',
    'delete video',
    'delete photo',
    'delete reel',
    'remove',
    'remove tag',
    'hide',
    'confirm',
    'yes',
    'ok',
    'okay',
    'ផ្លាស់ទី',
    'ផ្លាស់ទីទៅធុងសម្រាម',
    'ដាក់ប័ណ្ណសារ',
    'លុប',
    'ដកចេញ',
    'លាក់',
    'បញ្ជាក់',
    'យល់ព្រម',
  ];

  const CANCEL_BUTTON_LABELS = [
    'cancel',
    'close',
    'back',
    'no',
    'keep',
    'បោះបង់',
    'បិទ',
    'ថយក្រោយ',
    'ទេ',
    'រក្សាទុក',
  ];

  const POST_ACTION_LABEL_RE =
    /^(actions for this post|actions for this video|actions for this reel|more options for this post|more options for this video|more options for this reel|post options|សកម្មភាពសម្រាប់ការបង្ហោះនេះ|សកម្មភាពសម្រាប់វីដេអូនេះ|សកម្មភាពសម្រាប់ reel នេះ|ជម្រើសបន្ថែមសម្រាប់ការបង្ហោះនេះ)/i;

  const EXCLUDED_ACTION_LABEL_RE =
    /(comment|reply|like|react|share|send|message|chat|notification|profile|account|menu|close|filter|sort|setting|មតិ|ឆ្លើយតប|ចែករំលែក|ការជូនដំណឹង|ការកំណត់)/i;

  const RATE_LIMIT_TEXT_RE =
    /(you can't use this feature|temporarily blocked|try again later|limit how often|action blocked)/i;

  const POST_DELETED_TEXT_RE =
    /(moved to (your )?bin|moved to trash|moved to archive|hidden from (your )?(profile|timeline|page)|tag removed|this content isn't available|this post has been deleted|បានផ្លាស់ទីទៅធុងសម្រាម|បានដាក់ក្នុងប័ណ្ណសារ|ត្រូវបានលាក់|បានដកស្លាក|ផុសនេះត្រូវបានលុប)/i;

  const ERROR_TOAST_TEXT_RE =
    /(something went wrong|couldn't move|could not move|unable to delete|try again later|មានបញ្ហា|មិនអាចលុប)/i;

  const CONFIRM_DIALOG_TEXT_RE =
    /(move to your bin|move to bin|move to trash|move to archive|archive post|delete post|delete video|delete photo|delete reel|remove tag|hide from|items in your bin|ធុងសម្រាម|ប័ណ្ណសារ|លុបការបង្ហោះ|លុបវីដេអូ|ដកស្លាក|លាក់ពី)/i;

  const state = {
    status: STATUS.IDLE,
    lang: 'en',
    actionMode: MODE.REMOVE_ALL,
    deletedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    limit: 0,
    delayMs: 2500,
    autoScroll: true,
    logs: [],
    runToken: 0,
  };

  let processedButtons = new WeakSet();
  let processedContainers = new WeakSet();
  let processedFingerprints = new Set();

  function resetProcessedTracking() {
    processedButtons = new WeakSet();
    processedContainers = new WeakSet();
    processedFingerprints = new Set();
  }

  function formatTime(date = new Date()) {
    return date.toTimeString().slice(0, 8);
  }

  function normalizeText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function addLog(km, en, level = 'info') {
    state.logs.push({
      time: formatTime(),
      level,
      km,
      en,
    });
    if (state.logs.length > 60) {
      state.logs.shift();
    }
    broadcastState();
  }

  function getSerializableState() {
    return {
      status: state.status,
      lang: state.lang,
      actionMode: state.actionMode,
      deletedCount: state.deletedCount,
      skippedCount: state.skippedCount,
      errorCount: state.errorCount,
      limit: state.limit,
      delayMs: state.delayMs,
      autoScroll: state.autoScroll,
      logs: state.logs.slice(-40),
    };
  }

  function broadcastState() {
    try {
      const maybePromise = chrome.runtime.sendMessage({
        type: 'STATE_UPDATE',
        state: getSerializableState(),
      });
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    } catch (_) {
      // Popup is likely closed; ignore safely.
    }
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    if (el.closest && el.closest('[aria-hidden="true"]')) return false;
    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity || '1') === 0
    ) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function triggerClick(el) {
    if (!el || !el.isConnected) return;
    try {
      if (typeof el.focus === 'function') {
        el.focus({ preventScroll: true });
      }
    } catch (_) {
      // Ignore focus errors.
    }

    const common = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
    };

    if (typeof PointerEvent === 'function') {
      el.dispatchEvent(new PointerEvent('pointerdown', { ...common, pointerId: 1 }));
    }
    if (typeof MouseEvent === 'function') {
      el.dispatchEvent(new MouseEvent('mousedown', common));
    }
    if (typeof PointerEvent === 'function') {
      el.dispatchEvent(new PointerEvent('pointerup', { ...common, pointerId: 1 }));
    }
    if (typeof MouseEvent === 'function') {
      el.dispatchEvent(new MouseEvent('mouseup', common));
    }
    el.click();
  }

  function isButtonDisabled(el) {
    return Boolean(
      el.disabled ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.hasAttribute('disabled')
    );
  }

  function getPrimaryLabelCandidates(el) {
    const candidates = new Set();
    const aria = normalizeText(el.getAttribute('aria-label'));
    if (aria) candidates.add(aria);

    const rawText = String(el.innerText || el.textContent || '');
    for (const line of rawText.split('\n')) {
      const cleaned = normalizeText(line);
      if (cleaned) candidates.add(cleaned);
    }

    const spans = el.querySelectorAll('span');
    for (const span of spans) {
      const text = normalizeText(span.innerText || span.textContent);
      if (text && text.length <= 64) {
        candidates.add(text);
      }
    }
    return candidates;
  }

  function matchAnyLabel(candidates, labels) {
    for (const target of labels) {
      if (candidates.has(target)) return target;
    }
    return null;
  }

  function sleepRaw(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitWhilePausedOrSleep(ms, runToken) {
    let end = Date.now() + ms;
    while (true) {
      if (state.runToken !== runToken || state.status === STATUS.STOPPED) {
        return false;
      }
      if (state.status === STATUS.PAUSED) {
        const pauseTickStart = Date.now();
        await sleepRaw(150);
        end += Date.now() - pauseTickStart;
        continue;
      }
      if (state.status !== STATUS.RUNNING) {
        return false;
      }
      const remaining = end - Date.now();
      if (remaining <= 0) {
        return true;
      }
      await sleepRaw(Math.min(120, remaining));
    }
  }

  async function ensureActive(runToken) {
    return waitWhilePausedOrSleep(0, runToken);
  }

  function isInsideCommentOrChrome(el) {
    if (
      el.closest('[role="banner"], [role="navigation"], [role="dialog"]') ||
      el.closest('[aria-label*="comment" i]')
    ) {
      return true;
    }
    const article = el.closest('[role="article"]');
    if (article && article.parentElement?.closest('[role="article"]')) {
      return true;
    }
    return false;
  }

  function getPostContainer(btn) {
    if (!btn || !btn.closest) return null;
    return btn.closest(
      '[role="article"], [aria-posinset], [data-pagelet^="FeedUnit"]'
    );
  }

  function extractPermalinkKey(container) {
    if (!container || !container.querySelectorAll) return null;
    const links = container.querySelectorAll('a[href]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      if (!href || href === '#') continue;
      if (
        /(\/posts\/|\/videos\/|\/reel\/|\/watch\/|\/photo\/|story_fbid=|fbid=|pfbid)/i.test(
          href
        )
      ) {
        try {
          const url = new URL(
            href,
            window.location?.origin || 'https://www.facebook.com'
          );
          const idParam =
            url.searchParams.get('story_fbid') ||
            url.searchParams.get('fbid') ||
            url.searchParams.get('v') ||
            '';
          return `link:${url.pathname}${idParam ? `?id=${idParam}` : ''}`;
        } catch (_) {
          return `link:${href.split('?')[0]}`;
        }
      }
    }
    return null;
  }

  function getPostIdentifiers(btn) {
    const container = getPostContainer(btn);
    const permalinkKey = extractPermalinkKey(container);
    const textSnippet = container
      ? normalizeText(container.innerText).slice(0, 180)
      : '';
    const fallbackKey = textSnippet ? `text:${textSnippet}` : null;
    return { container, permalinkKey, fallbackKey };
  }

  function isPostAlreadyProcessed(btn) {
    if (processedButtons.has(btn)) return true;
    const { container, permalinkKey, fallbackKey } = getPostIdentifiers(btn);
    if (container && processedContainers.has(container)) return true;
    if (permalinkKey && processedFingerprints.has(permalinkKey)) return true;
    if (fallbackKey && processedFingerprints.has(fallbackKey)) return true;
    return false;
  }

  function markPostProcessed(btn, ids, includeFallbackKey = false) {
    if (btn) processedButtons.add(btn);
    if (ids?.container) processedContainers.add(ids.container);
    if (ids?.permalinkKey) processedFingerprints.add(ids.permalinkKey);
    if (includeFallbackKey && ids?.fallbackKey) {
      processedFingerprints.add(ids.fallbackKey);
    }
  }

  function isCandidateButton(btn) {
    return (
      isElementVisible(btn) &&
      !isButtonDisabled(btn) &&
      !isInsideCommentOrChrome(btn) &&
      !isPostAlreadyProcessed(btn)
    );
  }

  function findNextPostMenuButton() {
    const root = document.querySelector('[role="main"]') || document.body;

    // Pass 1: Explicit Facebook post/video/reel action aria-label.
    const labeledButtons = Array.from(
      root.querySelectorAll('[role="button"][aria-label], button[aria-label]')
    ).filter(isCandidateButton);

    for (const btn of labeledButtons) {
      const label = normalizeText(btn.getAttribute('aria-label'));
      if (POST_ACTION_LABEL_RE.test(label)) {
        return btn;
      }
    }

    // Pass 2: Structural fallback for top-right "..." menu buttons inside post cards.
    const menuButtons = Array.from(
      root.querySelectorAll(
        '[role="button"][aria-haspopup="menu"], button[aria-haspopup="menu"]'
      )
    ).filter(isCandidateButton);

    for (const btn of menuButtons) {
      const label = normalizeText(btn.getAttribute('aria-label'));
      if (EXCLUDED_ACTION_LABEL_RE.test(label)) continue;

      const postBox = getPostContainer(btn);
      if (!postBox) continue;

      const btnRect = btn.getBoundingClientRect();
      const postRect = postBox.getBoundingClientRect();
      const isIconSized =
        btnRect.width >= 16 &&
        btnRect.width <= 64 &&
        btnRect.height >= 16 &&
        btnRect.height <= 64;
      const isInHeader = btnRect.top - postRect.top <= 180;

      if (isIconSized && isInHeader) {
        return btn;
      }
    }

    return null;
  }

  function closeOpenMenus() {
    const openMenus = Array.from(document.querySelectorAll('[role="menu"]')).filter(
      isElementVisible
    );
    if (openMenus.length === 0) return;

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      })
    );
  }

  async function waitForVisibleMenu(runToken, timeoutMs = 3000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (!(await ensureActive(runToken))) return null;
      const menus = Array.from(document.querySelectorAll('[role="menu"]')).filter(
        (menu) => {
          if (!isElementVisible(menu)) return false;
          const items = menu.querySelectorAll(
            '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'
          );
          return Array.from(items).some(isElementVisible);
        }
      );
      if (menus.length > 0) {
        return menus[menus.length - 1];
      }
      await sleepRaw(100);
    }
    return null;
  }

  function getTargetLabelGroupsForMode(actionMode) {
    if (actionMode === MODE.ARCHIVE_ONLY) {
      return [{ labels: ARCHIVE_LABELS, type: 'archive' }];
    }
    if (actionMode === MODE.BIN_ONLY) {
      return [
        { labels: PRIMARY_BIN_LABELS, type: 'bin' },
        { labels: FALLBACK_DELETE_LABELS, type: 'delete' },
      ];
    }
    // MODE.REMOVE_ALL: try bin -> direct delete -> untag/hide/remove
    return [
      { labels: PRIMARY_BIN_LABELS, type: 'bin' },
      { labels: FALLBACK_DELETE_LABELS, type: 'delete' },
      { labels: REMOVE_HIDE_LABELS, type: 'remove' },
    ];
  }

  function findTargetMenuItem(menu, actionMode) {
    const items = Array.from(
      menu.querySelectorAll(
        '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'
      )
    ).filter((item) => isElementVisible(item) && !isButtonDisabled(item));

    const ignoreSet =
      actionMode === MODE.ARCHIVE_ONLY
        ? ALWAYS_IGNORE_LABELS
        : [...ALWAYS_IGNORE_LABELS, ...ARCHIVE_LABELS];

    const eligible = items.filter((item) => {
      const candidates = getPrimaryLabelCandidates(item);
      return !matchAnyLabel(candidates, ignoreSet);
    });

    const groups = getTargetLabelGroupsForMode(actionMode);
    for (const group of groups) {
      for (const item of eligible) {
        const candidates = getPrimaryLabelCandidates(item);
        const matched = matchAnyLabel(candidates, group.labels);
        if (matched) {
          return { item, matchedType: group.type, matchedLabel: matched };
        }
      }
    }

    return null;
  }

  function findConfirmButtonInDialog(dialog) {
    const buttons = Array.from(
      dialog.querySelectorAll('[role="button"], button')
    ).filter((btn) => isElementVisible(btn) && !isButtonDisabled(btn));

    for (const targetLabel of CONFIRM_BUTTON_LABELS) {
      for (const btn of buttons) {
        const candidates = getPrimaryLabelCandidates(btn);
        if (matchAnyLabel(candidates, CANCEL_BUTTON_LABELS)) continue;
        if (candidates.has(targetLabel)) {
          return btn;
        }
      }
    }
    return null;
  }

  function getVisibleDialogs() {
    return Array.from(document.querySelectorAll('[role="dialog"]')).filter(
      isElementVisible
    );
  }

  function isPostRemovedOrPlaceholder(postContainer, triggerBtn) {
    if (postContainer) {
      if (!postContainer.isConnected || !isElementVisible(postContainer)) {
        return true;
      }
      if (POST_DELETED_TEXT_RE.test(normalizeText(postContainer.innerText))) {
        return true;
      }
      if (triggerBtn && !triggerBtn.isConnected) {
        const remainingButtons = Array.from(
          postContainer.querySelectorAll(
            '[role="button"][aria-label], button[aria-label], [role="button"][aria-haspopup="menu"], button[aria-haspopup="menu"]'
          )
        ).filter((el) => {
          if (!isElementVisible(el) || isInsideCommentOrChrome(el)) return false;
          const label = normalizeText(el.getAttribute('aria-label'));
          return POST_ACTION_LABEL_RE.test(label);
        });
        if (remainingButtons.length === 0) {
          return true;
        }
      }
      return false;
    }

    return Boolean(
      triggerBtn && (!triggerBtn.isConnected || !isElementVisible(triggerBtn))
    );
  }

  function hasRateLimitBanner() {
    const alerts = Array.from(
      document.querySelectorAll('[role="alert"], [role="dialog"]')
    ).filter(isElementVisible);
    for (const el of alerts) {
      const text = normalizeText(el.innerText);
      if (RATE_LIMIT_TEXT_RE.test(text)) {
        return { kind: 'rate_limited', text };
      }
      if (ERROR_TOAST_TEXT_RE.test(text)) {
        return { kind: 'error', text };
      }
    }
    return null;
  }

  async function waitForConfirmDialogOrImmediateRemoval(
    triggerBtn,
    postContainer,
    existingDialogs,
    runToken,
    timeoutMs = 4500
  ) {
    const deadline = Date.now() + timeoutMs;
    const startTime = Date.now();

    while (Date.now() < deadline) {
      if (!(await ensureActive(runToken))) {
        return { status: 'aborted' };
      }

      const dialogs = getVisibleDialogs();
      // Pass A: Prefer newly opened dialogs that look like a confirm modal.
      for (let i = dialogs.length - 1; i >= 0; i--) {
        const dialog = dialogs[i];
        const dialogText = normalizeText(dialog.innerText);

        if (RATE_LIMIT_TEXT_RE.test(dialogText)) {
          return { status: 'rate_limited', dialog };
        }

        const isNewDialog = !existingDialogs.has(dialog);
        const looksLikeConfirmDialog = CONFIRM_DIALOG_TEXT_RE.test(dialogText);

        if (isNewDialog && looksLikeConfirmDialog) {
          const confirmBtn = findConfirmButtonInDialog(dialog);
          if (confirmBtn) {
            return { status: 'ready', dialog, confirmBtn };
          }
        }
      }

      // Pass B: Any new dialog with a confirm button, or matching confirm text.
      for (let i = dialogs.length - 1; i >= 0; i--) {
        const dialog = dialogs[i];
        const dialogText = normalizeText(dialog.innerText);
        const isNewDialog = !existingDialogs.has(dialog);
        const looksLikeConfirmDialog = CONFIRM_DIALOG_TEXT_RE.test(dialogText);

        if (isNewDialog || looksLikeConfirmDialog) {
          const confirmBtn = findConfirmButtonInDialog(dialog);
          if (confirmBtn) {
            return { status: 'ready', dialog, confirmBtn };
          }
        }
      }

      // Immediate actions (e.g. Hide from profile / Archive without confirmation dialog)
      if (
        Date.now() - startTime >= 1500 &&
        isPostRemovedOrPlaceholder(postContainer, triggerBtn)
      ) {
        return { status: 'removed_immediately' };
      }

      await sleepRaw(100);
    }

    return { status: 'timeout' };
  }

  async function waitForDialogToClose(dialog, runToken, timeoutMs = 6000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (!(await ensureActive(runToken))) return false;
      if (!isElementVisible(dialog)) return true;
      await sleepRaw(100);
    }
    return !isElementVisible(dialog);
  }

  async function waitForPostRemoval(
    postContainer,
    triggerBtn,
    runToken,
    timeoutMs = 4500
  ) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (!(await ensureActive(runToken))) return { status: 'aborted' };

      const alertInfo = hasRateLimitBanner();
      if (alertInfo?.kind === 'rate_limited') {
        return { status: 'rate_limited' };
      }

      if (isPostRemovedOrPlaceholder(postContainer, triggerBtn)) {
        return { status: 'removed' };
      }

      await sleepRaw(150);
    }

    const alertInfo = hasRateLimitBanner();
    if (alertInfo?.kind === 'rate_limited') {
      return { status: 'rate_limited' };
    }
    return { status: 'still_present' };
  }

  function getSuccessMessages(actionType, count) {
    if (actionType === 'archive') {
      return {
        km: `បានផ្លាស់ទីទៅប័ណ្ណសារ (Archive) ជោគជ័យ (#${count})`,
        en: `Moved to archive successfully (#${count})`,
      };
    }
    if (actionType === 'remove') {
      return {
        km: `បានដក/លាក់ផុសចេញជោគជ័យ (#${count})`,
        en: `Removed/hidden post successfully (#${count})`,
      };
    }
    if (actionType === 'delete') {
      return {
        km: `បានលុបផុសជោគជ័យ (#${count})`,
        en: `Deleted post successfully (#${count})`,
      };
    }
    return {
      km: `បានផ្លាស់ទីទៅធុងសម្រាមជោគជ័យ (#${count})`,
      en: `Moved to bin successfully (#${count})`,
    };
  }

  async function processSinglePost(btn, runToken) {
    const ids = getPostIdentifiers(btn);

    try {
      closeOpenMenus();
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!(await waitWhilePausedOrSleep(350, runToken))) return 'aborted';

      if (!btn.isConnected || !isElementVisible(btn)) {
        markPostProcessed(btn, ids, false);
        return 'skipped';
      }

      triggerClick(btn);
      const menu = await waitForVisibleMenu(runToken, 3000);
      if (state.runToken !== runToken || state.status === STATUS.STOPPED) {
        return 'aborted';
      }

      if (!menu) {
        markPostProcessed(btn, ids, true);
        state.skippedCount += 1;
        addLog(
          'មិនអាចបើកបញ្ជីជម្រើស (...) បានទេ — រំលងផុសនេះ',
          'Could not open post menu (...) — skipped',
          'warn'
        );
        return 'skipped';
      }

      if (!(await waitWhilePausedOrSleep(180, runToken))) return 'aborted';

      const targetMatch = findTargetMenuItem(menu, state.actionMode);
      if (!targetMatch) {
        closeOpenMenus();
        await waitWhilePausedOrSleep(250, runToken);
        markPostProcessed(btn, ids, true);
        state.skippedCount += 1;
        addLog(
          'រំលងផុស (គ្មានជម្រើសលុប ឬដកចេញដែលត្រូវគ្នា)',
          'Skipped post (no matching remove/delete option)',
          'warn'
        );
        return 'skipped';
      }

      const existingDialogs = new Set(getVisibleDialogs());
      triggerClick(targetMatch.item);

      const confirmResult = await waitForConfirmDialogOrImmediateRemoval(
        btn,
        ids.container,
        existingDialogs,
        runToken,
        4500
      );

      if (confirmResult.status === 'aborted') {
        return 'aborted';
      }

      if (confirmResult.status === 'rate_limited') {
        markPostProcessed(btn, ids, true);
        state.errorCount += 1;
        addLog(
          'Facebook កំពុងកំណត់ល្បឿន! បានផ្អាកដោយស្វ័យប្រវត្តិ — សូមរង់ចាំបន្តិចមុននឹងបន្ត។',
          'Facebook rate limit detected! Auto-paused — please wait before resuming.',
          'error'
        );
        return 'rate_limited';
      }

      if (confirmResult.status === 'removed_immediately') {
        markPostProcessed(btn, ids, false);
        state.deletedCount += 1;
        const msg = getSuccessMessages(targetMatch.matchedType, state.deletedCount);
        addLog(msg.km, msg.en, 'success');
        return 'deleted';
      }

      if (confirmResult.status === 'timeout') {
        closeOpenMenus();
        markPostProcessed(btn, ids, true);
        state.skippedCount += 1;
        addLog(
          'រកមិនឃើញផ្ទាំងបញ្ជាក់ការលុប — រំលងផុសនេះ',
          'Confirmation dialog not found — skipped post',
          'warn'
        );
        return 'skipped';
      }

      if (!(await ensureActive(runToken))) return 'aborted';
      triggerClick(confirmResult.confirmBtn);

      const dialogClosed = await waitForDialogToClose(
        confirmResult.dialog,
        runToken,
        6000
      );
      if (state.runToken !== runToken || state.status === STATUS.STOPPED) {
        return 'aborted';
      }

      if (!dialogClosed) {
        markPostProcessed(btn, ids, true);
        const alertInfo = hasRateLimitBanner();
        state.errorCount += 1;
        if (alertInfo?.kind === 'rate_limited') {
          addLog(
            'Facebook កំពុងកំណត់ល្បឿន! បានផ្អាកដោយស្វ័យប្រវត្តិ។',
            'Facebook rate limit detected! Auto-paused.',
            'error'
          );
          return 'rate_limited';
        }
        addLog(
          'ផ្ទាំងបញ្ជាក់ការលុបមិនព្រមបិទ — រំលងផុសនេះ',
          'Confirmation dialog did not close — skipped post',
          'error'
        );
        return 'not_removed';
      }

      const removal = await waitForPostRemoval(
        ids.container,
        btn,
        runToken,
        4500
      );
      if (removal.status === 'aborted') return 'aborted';

      if (removal.status === 'rate_limited') {
        markPostProcessed(btn, ids, true);
        state.errorCount += 1;
        addLog(
          'Facebook កំពុងកំណត់ល្បឿន! បានផ្អាកដោយស្វ័យប្រវត្តិ — សូមរង់ចាំបន្តិចមុននឹងបន្ត។',
          'Facebook rate limit detected! Auto-paused — please wait before resuming.',
          'error'
        );
        return 'rate_limited';
      }

      if (removal.status !== 'removed') {
        markPostProcessed(btn, ids, true);
        state.errorCount += 1;
        addLog(
          'បានចុចលុបរួច តែផុសនៅតែបង្ហាញលើទំព័រ — រំលងទៅផុសបន្ទាប់',
          'Confirmed action, but post stayed on page — skipped to next',
          'error'
        );
        return 'not_removed';
      }

      markPostProcessed(btn, ids, false);
      state.deletedCount += 1;
      const msg = getSuccessMessages(targetMatch.matchedType, state.deletedCount);
      addLog(msg.km, msg.en, 'success');
      return 'deleted';
    } catch (err) {
      markPostProcessed(btn, ids, true);
      state.errorCount += 1;
      const errMsg = err?.message || 'Unknown error';
      addLog(
        `មានបញ្ហាបច្ចេកទេស៖ ${errMsg}`,
        `Unexpected error: ${errMsg}`,
        'error'
      );
      return 'error';
    }
  }

  function isFeedLoadingSpinnerVisible() {
    const root = document.querySelector('[role="main"]') || document.body;
    const spinners = root.querySelectorAll('[role="progressbar"]');
    return Array.from(spinners).some(isElementVisible);
  }

  async function runDeletionLoop(runToken) {
    let emptyScrollCount = 0;
    let consecutiveNotRemoved = 0;

    while (state.runToken === runToken && state.status !== STATUS.STOPPED) {
      if (!(await ensureActive(runToken))) return;

      if (state.limit > 0 && state.deletedCount >= state.limit) {
        state.status = STATUS.COMPLETED;
        addLog(
          `បានបញ្ចប់តាមចំនួនកំណត់ (${state.deletedCount}/${state.limit} ផុស)។`,
          `Completed target limit (${state.deletedCount}/${state.limit} posts).`,
          'success'
        );
        return;
      }

      const nextBtn = findNextPostMenuButton();
      if (!nextBtn) {
        if (!state.autoScroll) {
          state.status = STATUS.COMPLETED;
          addLog(
            `បានបញ្ចប់ការសម្អាតផុសដែលបង្ហាញទាំងអស់ (សរុប ${state.deletedCount} ផុស)។`,
            `Completed all visible posts (Total: ${state.deletedCount}).`,
            'success'
          );
          return;
        }

        if (emptyScrollCount >= 6) {
          state.status = STATUS.COMPLETED;
          addLog(
            `រកមិនឃើញផុសថ្មីទៀតទេ — បានបញ្ចប់ (សរុប ${state.deletedCount} ផុស)។`,
            `No more posts found — completed (Total: ${state.deletedCount}).`,
            'success'
          );
          return;
        }

        const prevHeight = document.documentElement.scrollHeight;
        addLog(
          'កំពុងអូសទំព័រចុះក្រោមដើម្បីស្វែងរកផុសបន្ថែម...',
          'Scrolling down to load more posts...',
          'info'
        );
        window.scrollBy({
          top: Math.max(700, Math.round(window.innerHeight * 0.92)),
          behavior: 'smooth',
        });

        if (!(await waitWhilePausedOrSleep(2600, runToken))) return;

        if (isFeedLoadingSpinnerVisible()) {
          if (!(await waitWhilePausedOrSleep(2000, runToken))) return;
        }

        const newHeight = document.documentElement.scrollHeight;
        const foundAfterScroll = Boolean(findNextPostMenuButton());
        if (!foundAfterScroll && newHeight <= prevHeight && !isFeedLoadingSpinnerVisible()) {
          emptyScrollCount += 1;
        } else {
          emptyScrollCount = 0;
        }
        continue;
      }

      emptyScrollCount = 0;
      const result = await processSinglePost(nextBtn, runToken);

      if (result === 'aborted') return;

      if (result === 'rate_limited') {
        state.status = STATUS.PAUSED;
        broadcastState();
        continue;
      }

      if (result === 'not_removed') {
        consecutiveNotRemoved += 1;
        if (consecutiveNotRemoved >= 3) {
          state.status = STATUS.PAUSED;
          addLog(
            'បានផ្អាកស្វ័យប្រវត្តិ៖ ផុសចំនួន ៣ ជាប់គ្នាមិនរលាយបាត់ពីទំព័រ។ សូម Refresh ទំព័រ Facebook ឬពិនិត្យសិទ្ធិ Page។',
            'Auto-paused: 3 consecutive posts remained on page. Please refresh Facebook or verify Page permissions.',
            'error'
          );
          continue;
        }
      } else {
        consecutiveNotRemoved = 0;
      }

      if (state.limit > 0 && state.deletedCount >= state.limit) {
        state.status = STATUS.COMPLETED;
        addLog(
          `បានបញ្ចប់តាមចំនួនកំណត់ (${state.deletedCount}/${state.limit} ផុស)។`,
          `Completed target limit (${state.deletedCount}/${state.limit} posts).`,
          'success'
        );
        return;
      }

      const waitMs = result === 'deleted' ? state.delayMs : 600;
      if (!(await waitWhilePausedOrSleep(waitMs, runToken))) return;
    }
  }

  function startAutomation(options = {}) {
    if (options.lang === 'km' || options.lang === 'en') {
      state.lang = options.lang;
    }

    if (state.status === STATUS.RUNNING) {
      return getSerializableState();
    }

    const limitVal = Number.isFinite(Number(options.limit))
      ? Math.max(0, Math.floor(Number(options.limit)))
      : 0;
    const delaySec = Number.isFinite(Number(options.delaySec))
      ? Math.min(30, Math.max(1, Number(options.delaySec)))
      : 2.5;
    const autoScrollVal =
      typeof options.autoScroll === 'boolean' ? options.autoScroll : true;
    const modeVal = Object.values(MODE).includes(options.actionMode)
      ? options.actionMode
      : MODE.REMOVE_ALL;

    state.limit = limitVal;
    state.delayMs = Math.round(delaySec * 1000);
    state.autoScroll = autoScrollVal;
    state.actionMode = modeVal;

    if (state.status !== STATUS.PAUSED) {
      state.deletedCount = 0;
      state.skippedCount = 0;
      state.errorCount = 0;
      resetProcessedTracking();
    }

    state.status = STATUS.RUNNING;
    state.runToken += 1;
    const currentToken = state.runToken;

    const limitKm = state.limit > 0 ? `${state.limit} ផុស` : 'លុបទាំងអស់';
    const limitEn = state.limit > 0 ? `${state.limit} posts` : 'Remove All';
    const secStr = (state.delayMs / 1000).toFixed(1);

    addLog(
      `ចាប់ផ្តើមដំណើរការ (${limitKm}, រង់ចាំ៖ ${secStr} វិ.)`,
      `Started cleaning (${limitEn}, delay: ${secStr}s)`,
      'info'
    );

    runDeletionLoop(currentToken);
    return getSerializableState();
  }

  function pauseAutomation() {
    if (state.status !== STATUS.RUNNING) return getSerializableState();
    state.status = STATUS.PAUSED;
    addLog(
      'បានផ្អាកដំណើរការជាបណ្តោះអាសន្ន។',
      'Paused cleaning temporarily.',
      'warn'
    );
    return getSerializableState();
  }

  function resumeAutomation() {
    if (state.status !== STATUS.PAUSED) return getSerializableState();
    state.status = STATUS.RUNNING;
    addLog('កំពុងបន្តដំណើរការឡើងវិញ...', 'Resuming cleaning...', 'info');
    return getSerializableState();
  }

  function stopAutomation() {
    if (
      state.status === STATUS.IDLE ||
      state.status === STATUS.STOPPED ||
      state.status === STATUS.COMPLETED
    ) {
      return getSerializableState();
    }
    state.runToken += 1;
    state.status = STATUS.STOPPED;
    closeOpenMenus();
    addLog(
      `បានបញ្ឈប់ដោយអ្នកប្រើប្រាស់ (សម្អាតបាន ${state.deletedCount} ផុស)។`,
      `Stopped by user (cleaned ${state.deletedCount} posts).`,
      'warn'
    );
    return getSerializableState();
  }

  function resetAutomation() {
    if (state.status === STATUS.RUNNING || state.status === STATUS.PAUSED) {
      state.runToken += 1;
    }
    state.status = STATUS.IDLE;
    state.deletedCount = 0;
    state.skippedCount = 0;
    state.errorCount = 0;
    state.logs = [];
    resetProcessedTracking();
    broadcastState();
    return getSerializableState();
  }

  function setLanguage(lang) {
    if (lang === 'km' || lang === 'en') {
      state.lang = lang;
      broadcastState();
    }
    return getSerializableState();
  }

  window.__vhFbCleanerController = {
    isAlive() {
      try {
        return Boolean(chrome?.runtime?.id);
      } catch (_) {
        return false;
      }
    },
    teardown() {
      state.runToken += 1;
      state.status = STATUS.STOPPED;
    },
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'GET_STATE':
        sendResponse(getSerializableState());
        break;
      case 'START':
        sendResponse(startAutomation(message.options || {}));
        break;
      case 'PAUSE':
        sendResponse(pauseAutomation());
        break;
      case 'RESUME':
        sendResponse(resumeAutomation());
        break;
      case 'STOP':
        sendResponse(stopAutomation());
        break;
      case 'RESET':
        sendResponse(resetAutomation());
        break;
      case 'SET_LANG':
        sendResponse(setLanguage(message.lang));
        break;
      default:
        sendResponse(getSerializableState());
    }
  });
})();

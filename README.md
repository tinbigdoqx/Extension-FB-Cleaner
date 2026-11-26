<div align="center">

<img src="icons/icon128.png" width="96" height="96" alt="VH FB Cleaner Logo" />

# VH FB Cleaner

**Smartly bulk-remove, move to bin, or archive Facebook posts, videos, photos & tags in one click — fast, safe, and effortless.**

![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-0284c7?style=for-the-badge&logo=googlechrome&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla_JS-0d1117?style=for-the-badge&logo=javascript&logoColor=38BDF8)
![Bilingual](https://img.shields.io/badge/UI-English_%2F_%E1%9E%81%E1%9F%92%E1%9E%98%E1%9F%82%E1%9E%9A-7C3AED?style=for-the-badge)
![Privacy](https://img.shields.io/badge/100%25_Local-Zero_Tracking-10B981?style=for-the-badge)

</div>

---

## ✨ Features

* **Three Smart Cleanup Modes**
  * **Remove All**: Moves posts to Bin, deletes where available, or removes/hides tagged posts.
  * **Move to Bin Only**: Safely sends posts to your Facebook Bin (recoverable for 30 days).
  * **Archive Only**: Moves posts into your Facebook Archive without deleting them.
* **Full Safety & Flow Controls**
  * Set post limits (`All`, `50`, `100`, `500`, or any custom number).
  * Customize delay interval (`1s` to `30s`) to keep actions smooth and natural.
  * Toggle **Auto-Scroll** and use **Start / Pause / Stop / Reset** controls anytime.
  * Live **Deleted / Skipped / Errors** counters, progress bar, and real-time activity log.
* **Bilingual Interface (`EN` / `ខ្មែរ`)**
  * Instant language switching between **English** and **Khmer** right inside the popup.
* **Supported Facebook Domains**
  * `www.facebook.com` · `web.facebook.com` · `m.facebook.com` · `business.facebook.com`

---

## 🚀 Installation (Chrome / Edge / Brave)

1. Click **`Code` → `Download ZIP`** on this repository (or download the packaged archive in `webstore/vh-fb-cleaner-v2.0.0.zip`) and extract it.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle at the top-right corner).
4. Click **Load unpacked** and select the extracted **`VH-FB-Cleaner`** folder.
5. Pin **VH FB Cleaner** to your browser toolbar.

---

## 📖 How to Use

1. Open your **Facebook Profile**, **Facebook Page**, or **Manage Posts / Activity Log** in Chrome.
2. Click the **VH FB Cleaner** extension icon.
3. Select your language (`EN` / `ខ្មែរ`), **Action Mode**, **Limit**, and **Delay**.
4. Click **Start Cleaning** and monitor progress in real time.

---

## 🔒 Privacy & Permissions

**VH FB Cleaner runs 100% locally in your browser.** No external servers, no analytics, and no collection of passwords or personal data.

| Permission | Purpose |
| :--- | :--- |
| `storage` | Saves your local UI settings (`language`, `mode`, `limit`, `delay`, `autoScroll`) in `chrome.storage.local`. |
| `scripting` | Injects `content.js` into an already-open Facebook tab if you start cleaning right after installing/reloading. |
| Facebook Host Permissions | Allows the local script to interact only with active supported Facebook pages when started by you. |

See [webstore/privacy-policy.html](webstore/privacy-policy.html) for the full Privacy Policy.

---

## 📁 Project Structure

```text
VH-FB-Cleaner/
├── manifest.json             # Chrome Extension Manifest V3 config
├── popup.html / popup.css    # Bilingual popup UI & styling
├── popup.js                  # Popup state, presets & messaging
├── content.js                # Facebook DOM automation controller
├── icons/                    # Extension icons (16px, 48px, 128px)
└── webstore/                 # Chrome Web Store listing, privacy policy & release zip
```

---

## 🌐 Connect & Support

* **Developer**: [Tin (@tinbigdoqx)](https://github.com/tinbigdoqx) — Founder @ [VH Digital Store](https://vhdigital.store/)
* **Telegram Admin**: [@vh_digital](https://t.me/vh_digital)
* **Telegram Channel**: [VH Digital Channel](https://t.me/vhdigitalchannel)
* **Facebook Page**: [VH Digital](https://www.facebook.com/vhdigitalkh)

> **Disclaimer**: VH FB Cleaner is an independent tool developed by VH Digital and is not affiliated with or endorsed by Meta Platforms, Inc. or Facebook. Always review your selected mode before running bulk actions.

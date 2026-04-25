# YouTube Filter Script

A Tampermonkey userscript that cleans up YouTube by removing clutter you probably don't want to see.

## What it does

- 🚫 Removes **Members Only** videos from your feed and sidebar
- ▶️ Hides **Shorts** from the main feed, sidebar, and nav menu — with a toggle button to show them when you want
- 👁️ Removes videos with **fewer than 1,000 views** from your feed and sidebar
---
## Disclaimer

This script is provided **as-is**, for personal use only, with no warranties or guarantees of any kind.

- I am not responsible for any issues that arise from using this script, including but not limited to broken YouTube functionality, missed content, or unintended side effects.
- I am not affiliated with YouTube, Google, or Tampermonkey in any way.
- Tampermonkey is a third-party browser extension. I have no control over its behaviour, updates, or security. Use it at your own discretion.
- YouTube frequently updates its layout and code. This script may stop working at any time as a result, and I cannot guarantee it will always be maintained or updated.
- By installing and using this script you accept that you do so entirely at your own risk.

If you're unsure about running userscripts in your browser, don't. This is intended for people who are comfortable with browser extensions and understand what userscripts are.
---
## Installation

### Step 1 — Install Tampermonkey

Tampermonkey is a free browser extension that runs userscripts like this one.

| Browser | Link |
|--------|------|
| Chrome | [Install Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Install Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Edge | [Install Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |

### Step 2 — Enable Tampermonkey permissions

After installing, you need to allow Tampermonkey to run scripts:

1. Click the **Extensions** puzzle piece icon in your Chrome toolbar (top right)
2. Find **Tampermonkey** in the list and click the **three dots** next to it
3. Click **"Manage extension"**
4. You'll see a setting that says **"Allow user scripts"** — click the toggle to enable it
   > Chrome will warn you that the extension can run code not reviewed by Google. This is normal for all userscripts and safe as long as you trust where the script comes from.
5. Also enable **"Allow access to file URLs"** on the same page

### Step 3 — Install the script

Click the link below to install the script:

👉 **[Click here to install the script](https://raw.githubusercontent.com/rogerobrien/tampermonkey-youtube-filter/main/youtube-clean-feed.user.js)**

> A Tampermonkey popup will appear asking you to confirm — click **Install**.

### Step 4 — Go to YouTube

The script runs automatically. You don't need to do anything else.

> you will know the script is running when the extention has a small red indicator when you are on the site where the script is running.

---

## How to use the Shorts toggle

A **"▶ Show Shorts"** button will appear in the YouTube toolbar next to the search bar. Click it to show Shorts when you want to browse them. Click **"✕ Hide Shorts"** to hide them again. Your preference is remembered between sessions.

---

## Adjusting the minimum view count

By default, videos with fewer than **1,000 views** are hidden. To change this:

1. Open the script in Tampermonkey:
   - Click the Tampermonkey icon in your browser toolbar
   - Click **Dashboard**
   - Click the script name to open the editor
2. Find this line near the top:
```javascript
   const MIN_VIEWS = 1000;
```
3. Change `1000` to any number you like, for example:
```javascript
   const MIN_VIEWS = 5000;  // hides videos with under 5,000 views
   const MIN_VIEWS = 500;   // hides videos with under 500 views
   const MIN_VIEWS = 0;     // disables the filter entirely
```
4. Click **File → Save** (or `Ctrl+S`)

---

## Updating the script

Tampermonkey checks for updates automatically. To check manually:

1. Click the Tampermonkey icon in your browser toolbar
2. Click **Dashboard**
3. Click the **"Check for updates"** button next to the script

---

## Troubleshooting

**The Shorts toggle button isn't showing up**
> Try refreshing the page. If it still doesn't appear, the button will fall back to the bottom-right corner of the screen.

**Some Shorts or Members Only videos are still showing**
> YouTube occasionally updates its page layout which can break selectors. Check back here for an updated version of the script, or open an issue below.

**The view count filter isn't working on some videos**
> YouTube sometimes loads video metadata after the initial page render. The script watches for these late-loading elements, but very slow connections may occasionally miss some. Scrolling down and back up usually triggers a re-scan.

**Tampermonkey script does not load after enstalation**
>Ensure the allow options are enabled in the extention, if they are try enabling developer mode in the top right of the screen where you chane the user extentions

---

## Auto-updates

The script updates itself automatically as long as you installed it via the install link above. You don't need to do anything.

When an update is available, Tampermonkey will download it silently in the background. You can confirm the script is up to date by:

1. Clicking the Tampermonkey icon in your toolbar
2. Clicking **Dashboard**
3. Checking the version number next to the script name matches the latest version in the [Changelog](#changelog)

To trigger an immediate update check:
1. Open the Tampermonkey **Dashboard**
2. Click the **"Check for updates"** icon (the circular arrow) next to the script

## Changelog

| Version | Changes |
|---------|---------|
| 1.6 | Added `yt-navigate-finish` listener to re-inject button on SPA navigation |
| 1.5 | Added low view count filter with configurable `MIN_VIEWS` threshold |
| 1.4 | Added persistent Shorts toggle button injected into YouTube toolbar |
| 1.3 | Added Shorts removal from main feed, sidebar, and nav menu |
| 1.2 | Initial release — Members Only video removal |

---

## Issues or suggestions

If something stops working or you have an idea for a new filter, [open an issue](https://github.com/rogerobrien/tampermonkey-youtube-filter/issues) on this page and describe what you're seeing.

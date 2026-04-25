// ==UserScript==
// @name         YouTube - Hide "Members Only", Shorts & Low View Videos
// @namespace    https://github.com/roger-youtube-filter
// @version      1.6
// @description  Removes Members Only videos, filters Shorts with a toggle, and hides videos under a configurable view threshold.
// @author       Roger
// @match        https://www.youtube.com/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
(function () {
    'use strict';

    // ── Config ──────────────────────────────────────────────────────────────
    const MIN_VIEWS = 1000;

    const SELECTORS_TO_REMOVE = [
        'yt-lockup-view-model',
        'ytd-compact-video-renderer',
        'ytd-video-renderer',
        'ytd-rich-item-renderer',
        'ytd-grid-video-renderer'
    ].join(',');

    // ── State ───────────────────────────────────────────────────────────────
    let shortsHidden = GM_getValue('shortsHidden', true);

    // ── View count parser ───────────────────────────────────────────────────
    function parseViewCount(text) {
        if (!text) return null;
        const cleaned = text.toLowerCase().replace(/,/g, '').replace(/views?/, '').trim();
        if (cleaned.includes('no views')) return 0;
        const match = cleaned.match(/([\d.]+)\s*([km]?)/);
        if (!match) return null;
        let num = parseFloat(match[1]);
        if (match[2] === 'k') num *= 1_000;
        if (match[2] === 'm') num *= 1_000_000;
        return Math.floor(num);
    }

    function isBelowThreshold(text) {
        const views = parseViewCount(text);
        return views !== null && views < MIN_VIEWS;
    }

    // ── Low view removal ────────────────────────────────────────────────────
    function removeLowViewVideos() {
        // Main feed & grid
        document.querySelectorAll('ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer').forEach(container => {
            if (container.dataset.removedByViewFilter) return;
            const metaItems = container.querySelectorAll('span.inline-metadata-item');
            for (const item of metaItems) {
                const text = item.textContent.trim();
                if (text.toLowerCase().includes('view') && isBelowThreshold(text)) {
                    container.dataset.removedByViewFilter = '1';
                    container.remove();
                    console.debug('[YouTube Filter] Removed low-view video:', text, container);
                    break;
                }
            }
        });

        // Sidebar
        document.querySelectorAll('ytd-compact-video-renderer').forEach(container => {
            if (container.dataset.removedByViewFilter) return;
            const metaItems = container.querySelectorAll('span.inline-metadata-item');
            for (const item of metaItems) {
                const text = item.textContent.trim();
                if (text.toLowerCase().includes('view') && isBelowThreshold(text)) {
                    container.dataset.removedByViewFilter = '1';
                    container.remove();
                    console.debug('[YouTube Filter] Removed low-view sidebar video:', text, container);
                    break;
                }
            }
        });

        // Newer lockup layout
        document.querySelectorAll('yt-lockup-view-model').forEach(container => {
            if (container.dataset.removedByViewFilter) return;
            const metaEl = container.querySelector('.yt-content-metadata-view-model-wiz__metadata-text');
            if (!metaEl) return;
            const text = metaEl.textContent.trim();
            if (text.toLowerCase().includes('view') && isBelowThreshold(text)) {
                container.dataset.removedByViewFilter = '1';
                container.remove();
                console.debug('[YouTube Filter] Removed low-view lockup:', text, container);
            }
        });
    }

    // ── Shorts removal ──────────────────────────────────────────────────────
    const SHORTS_SHELF_SELECTORS = [
        'ytd-rich-shelf-renderer[is-shorts]',
        'ytd-reel-shelf-renderer',
        'ytd-shorts',
    ].join(',');

    function applyShortVisibility() {
        document.querySelectorAll(SHORTS_SHELF_SELECTORS).forEach(el => {
            el.style.display = shortsHidden ? 'none' : '';
        });
        document.querySelectorAll('ytd-rich-item-renderer a#thumbnail[href*="/shorts/"]').forEach(link => {
            const container = link.closest('ytd-rich-item-renderer');
            if (container) container.style.display = shortsHidden ? 'none' : '';
        });
        document.querySelectorAll('ytd-compact-video-renderer a#thumbnail[href*="/shorts/"]').forEach(link => {
            const container = link.closest('ytd-compact-video-renderer');
            if (container) container.style.display = shortsHidden ? 'none' : '';
        });
        document.querySelectorAll('ytd-guide-entry-renderer a[title="Shorts"]').forEach(el => {
            const container = el.closest('ytd-guide-entry-renderer');
            if (container) container.style.display = shortsHidden ? 'none' : '';
        });
    }

    // ── Members Only removal ────────────────────────────────────────────────
    function removeMembersOnlyVideos() {
        const badges = document.querySelectorAll('.yt-badge-shape--commerce');
        badges.forEach(badge => {
            const text = (badge.textContent || '').trim().toLowerCase();
            if (text.includes('members only') || text === 'members') {
                const container = badge.closest(SELECTORS_TO_REMOVE);
                if (container && !container.dataset.removedByMembersFilter) {
                    container.dataset.removedByMembersFilter = '1';
                    container.remove();
                    console.debug('[YouTube Filter] Removed Members Only video:', container);
                }
            }
        });
    }

    // ── Toggle Button UI ────────────────────────────────────────────────────
    function updateButtonLabel(btn) {
        if (shortsHidden) {
            btn.textContent = '▶  Show Shorts';
            btn.style.background = '#212121';
            btn.style.color = '#ffffff';
        } else {
            btn.textContent = '✕  Hide Shorts';
            btn.style.background = '#ff0000';
            btn.style.color = '#ffffff';
        }
    }

    function createToggleButton() {
        if (document.getElementById('yt-shorts-toggle-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'yt-shorts-toggle-btn';
        updateButtonLabel(btn);

        Object.assign(btn.style, {
            display:      'flex',
            alignItems:   'center',
            padding:      '0 12px',
            height:       '40px',
            borderRadius: '20px',
            border:       'none',
            cursor:       'pointer',
            fontFamily:   'Roboto, Arial, sans-serif',
            fontSize:     '13px',
            fontWeight:   '500',
            boxShadow:    '0 1px 4px rgba(0,0,0,0.3)',
            transition:   'background 0.2s, transform 0.1s',
            flexShrink:   '0',
            marginRight:  '8px',
        });

        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        btn.addEventListener('click', () => {
            shortsHidden = !shortsHidden;
            GM_setValue('shortsHidden', shortsHidden);
            updateButtonLabel(btn);
            applyShortVisibility();
            console.info('[YouTube Filter] Shorts toggled:', shortsHidden ? 'hidden' : 'visible');
        });

        function injectIntoToolbar() {
            const micBtn = document.querySelector('#voice-search-button');
            if (micBtn && micBtn.parentNode) {
                micBtn.parentNode.insertBefore(btn, micBtn.nextSibling);
                console.info('[YouTube Filter] Shorts toggle injected into toolbar');
                return true;
            }
            return false;
        }

        if (!injectIntoToolbar()) {
            const pollInterval = setInterval(() => {
                if (injectIntoToolbar()) clearInterval(pollInterval);
            }, 500);
            setTimeout(() => {
                clearInterval(pollInterval);
                if (!document.getElementById('yt-shorts-toggle-btn')) {
                    Object.assign(btn.style, {
                        position: 'fixed',
                        bottom:   '24px',
                        right:    '24px',
                        zIndex:   '9999',
                    });
                    document.body.appendChild(btn);
                    console.warn('[YouTube Filter] Toolbar injection failed, using fixed fallback');
                }
            }, 10000);
        }
    }

    // ── Run all filters ─────────────────────────────────────────────────────
    function runAllFilters() {
        applyShortVisibility();
        removeMembersOnlyVideos();
        removeLowViewVideos();
    }

    runAllFilters();
    createToggleButton();

    // Re-inject button on YouTube's soft navigations (SPA page changes)
    window.addEventListener('yt-navigate-finish', () => {
        createToggleButton();
        runAllFilters();
    });

    const observer = new MutationObserver(mutations => {
        let needsScan = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) { needsScan = true; break; }
        }
        if (needsScan) runAllFilters();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.info('[YouTube Filter] Running - Members Only, Shorts & low-view videos filtered');
})();

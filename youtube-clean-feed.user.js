// ==UserScript==
// @name         YouTube - Hide "Members Only", Shorts & Low View Videos
// @namespace    https://github.com/rogerobrien/tampermonkey-youtube-filter
// @version      1.9.1
// @description  Removes Members Only videos, filters Shorts with a toggle, and hides videos under a configurable view threshold.
// @author       Roger
// @match        https://www.youtube.com/*
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/rogerobrien/tampermonkey-youtube-filter/main/youtube-clean-feed.user.js
// @downloadURL  https://raw.githubusercontent.com/rogerobrien/tampermonkey-youtube-filter/main/youtube-clean-feed.user.js
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
            const metaItems = container.querySelectorAll(
                'span.inline-metadata-item, .ytContentMetadataViewModelMetadataText'
            );
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
            const metaItems = container.querySelectorAll(
                'span.inline-metadata-item, .ytContentMetadataViewModelMetadataText'
            );
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
            const metaEls = container.querySelectorAll(
                '.yt-content-metadata-view-model-wiz__metadata-text, .ytContentMetadataViewModelMetadataText'
            );
            for (const metaEl of metaEls) {
                const text = metaEl.textContent.trim();
                if (text.toLowerCase().includes('view') && isBelowThreshold(text)) {
                    container.dataset.removedByViewFilter = '1';
                    container.remove();
                    console.debug('[YouTube Filter] Removed low-view lockup:', text, container);
                    break;
                }
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
    function updateButtonLabel(wrapper, track, thumb) {
        if (shortsHidden) {
            track.style.background = '#606060';
            thumb.style.transform = 'translateX(0px)';
            wrapper.title = 'Shorts are hidden — click to show';
        } else {
            track.style.background = '#2ba640';
            thumb.style.transform = 'translateX(20px)';
            wrapper.title = 'Shorts are visible — click to hide';
        }
    }

    function createToggleButton() {
        if (document.getElementById('yt-shorts-toggle-btn')) return;

        // Outer wrapper
        const wrapper = document.createElement('div');
        wrapper.id = 'yt-shorts-toggle-btn';
        Object.assign(wrapper.style, {
            display:     'flex',
            alignItems:  'center',
            gap:         '8px',
            marginLeft:  '12px',
            marginRight: '4px',
            cursor:      'pointer',
            userSelect:  'none',
            flexShrink:  '0',
        });

        // Label
        const label = document.createElement('span');
        label.textContent = 'Shorts';
        Object.assign(label.style, {
            fontFamily: 'Roboto, Arial, sans-serif',
            fontSize:   '13px',
            fontWeight: '500',
            color:      'var(--yt-spec-text-primary, #fff)',
        });

        // Toggle track
        const track = document.createElement('div');
        Object.assign(track.style, {
            width:        '44px',
            height:       '24px',
            borderRadius: '12px',
            background:   shortsHidden ? '#606060' : '#2ba640',
            position:     'relative',
            transition:   'background 0.2s',
            flexShrink:   '0',
        });

        // Toggle thumb
        const thumb = document.createElement('div');
        Object.assign(thumb.style, {
            width:        '18px',
            height:       '18px',
            borderRadius: '50%',
            background:   '#ffffff',
            position:     'absolute',
            top:          '3px',
            left:         '3px',
            transition:   'transform 0.2s',
            transform:    shortsHidden ? 'translateX(0px)' : 'translateX(20px)',
        });

        track.appendChild(thumb);
        wrapper.appendChild(label);
        wrapper.appendChild(track);

        wrapper.addEventListener('click', () => {
            shortsHidden = !shortsHidden;
            GM_setValue('shortsHidden', shortsHidden);
            updateButtonLabel(wrapper, track, thumb);
            applyShortVisibility();
            console.info('[YouTube Filter] Shorts toggled:', shortsHidden ? 'hidden' : 'visible');
        });

        wrapper.addEventListener('mouseenter', () => { track.style.opacity = '0.85'; });
        wrapper.addEventListener('mouseleave', () => { track.style.opacity = '1'; });

        function injectIntoToolbar() {
            const micBtn = document.querySelector('#voice-search-button');
            if (micBtn && micBtn.parentNode) {
                micBtn.parentNode.insertBefore(wrapper, micBtn.nextSibling);
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
                    Object.assign(wrapper.style, {
                        position: 'fixed',
                        bottom:   '24px',
                        right:    '24px',
                        zIndex:   '9999',
                    });
                    document.body.appendChild(wrapper);
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

    // Re-inject button on YouTube's soft navigations
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

// v3 https://github.com/ColasNahaboo/colas-miniflux-tools
// paste this in the Miniflux settings, Application Settings / Custom JavaScript


//=============================================================================
// open the original articled always in the same window

// IMPORTANT: Use a browser extension to supress the HTTP response header
// Cross-Origin-Opener-Policy
// like https://github.com/warren-bank/crx-simple-modify-headers/tree/extended
// To be sure that original articles open ALWAYS in the same window

// Maintain a global reference to the reader window so we can message it
let readerWindowReference = null;

function openInMinifluxReaderWindow() {
    // Find the original link. 
    // We look inside the currently selected item first (for list view), 
    // then fall back to the first match on the page (for single article view).
    let link = document.querySelector('.current-item a[data-original-link="true"], .current a[data-original-link="true"]');
    if (!link) {
        link = document.querySelector('a[data-original-link="true"]');
    }
    if (link && link.href) {
        // Open the URL in our specific, reusable window and track its context reference
        readerWindowReference = window.open(link.href, 'miniflux-reader');
        
        // Windows focus fix: immediately snap focus back to Miniflux window
        if (readerWindowReference) {
            window.focus();
        }
    }
    // mark the article as read if we did not open it
    if (! /\/(entry)(\/|$)/.test(window.location.pathname)) {
        return 'm';
    }
    return '';
}

//=============================================================================
// (Re)Define some keys

// 'b' acts as 'v' on view: Open original link
// ' ' on an article:
//    - if the page contents fits in the window (no scroll), emit 'v'
//    - if the page can scroll down, scroll down natively
//    - if we are at the bottom, emit 'j' (Go to next item)
// 'n' scrolls down the page, and jumps to next item when at the bottom
// 'x' scrolls up by half a page
// 'i' Undoes 'j' by emitting [g, h, j, j, o] to get prev item from history
// also, 'q w e' synonyms of 'k space j' for common navigation with left-hand
// ',' and '.' remotely scroll the miniflux-reader window up and down

(function() {
    // Intercept the key event at the root prototype level before ANY listener
    const originalGetKey = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key').get;
    Object.defineProperty(KeyboardEvent.prototype, 'key', {
        get: function() {
            const realKey = originalGetKey.call(this);
            
            // CHECK 1: Do not modify keys if typing in a text/input field
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === 'INPUT' ||  
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            )) {
                return realKey;
            }
            // CHECK 2: Do not modify keys if Ctrl, Alt, or Meta are held down
            if (this.ctrlKey || this.altKey || this.metaKey) {
                return realKey;
            }
            // CHECK 3: We are in 'view' windows
            if (! /^\/(unread|history|entry|category)(\/|$)/.test(window.location.pathname)) {
                return realKey;
            }

            // ============ KEYDEFS START ============
            // This section is moodular: add/remove KEYDEFs blocks at will here
            
            // KEYDEF: 'b' synonym of 'v' go to the original article
            if (realKey === 'b') {
                return openInMinifluxReaderWindow();
            }

            // KEYDEF: 'e' synonym of 'j' go to next article
            if (realKey === 'e') {
                return 'j';
            }

            // KEYDEF: 'q' synonym of 'k' go to previous article
            if (realKey === 'q') {
                return 'k';
            }

            // KEYDEF: ' ' or ' w'  Smart Space either
            // scrolls down natively, goes to original article, or go next item
            if (realKey === ' ' || realKey == 'w') {
                // dont scroll on items lists
                if (/^\/(unread|category\/[0-9]*\/entries)$/.test(window.location.pathname)) {
                    return openInMinifluxReaderWindow();
                }
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                if (scrollHeight <= clientHeight) {
                    openInMinifluxReaderWindow();
                    return 'j';
                }
                const atBottom = (clientHeight + scrollTop >= scrollHeight - 5);
                if (atBottom) {
                    return 'j';
                }
                return realKey; 
            }
            
            // KEYDEF: 'x' Half-Page Scroll Up, as key is close to space.
            if (realKey === 'x' || realKey == 'q') {
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                if (scrollHeight <= clientHeight) {
                    return '';
                }
                window.scrollBy({
                    top: -(clientHeight / 2),
                    behavior: 'smooth'
                });
                return ''; 
            }
            
            // KEYDEF: 'n' try to scroll down before going to the next item
            if (realKey === 'n') {
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                // if the page has no vertical scroll bars at all, next item
                if (scrollHeight <= clientHeight) {
                    return 'j';
                }
                // Next item if we are already at the bottom.
                // We use a 2px buffer to handle browser sub-pixel rounding.
                if (clientHeight + scrollTop >= scrollHeight - 5) {
                    return 'j';
                }
                window.scrollBy({
                    top: clientHeight - 40,
                    behavior: 'auto'
                });
                return ''; 
            }

            // KEYDEF: 'i' Undoes 'j' by emitting [g h j j o]
            // Since miniflux is a SPA, no need to manage document resets
            if (realKey === 'i') {
                const macroSequence = ['g', 'h', 'j', 'j', 'o'];
                // Wait milliseconds between keys, especially after h
                // that loads the history
                const timings = [0, 40, 250, 400, 550]; 
                macroSequence.forEach((char, index) => {
                    setTimeout(() => {
                        const macroEvent = new KeyboardEvent('keydown', {
                            key: char,
                            bubbles: true,
                            cancelable: true
                        });
                        // Dispatching to document.activeElement || document
                        // ensures both local item focus and global document
                        // event listeners catch the synthetic stroke flawlessly.
                        (document.activeElement || document).dispatchEvent(macroEvent);
                    }, timings[index]);
                });
                return ""; // swallow the original 'i' key execution
            }

            // KEYDEF: ',' (Comma) -> Remote Scroll Up reader window
            if (realKey === ',') {
                if (readerWindowReference && !readerWindowReference.closed) {
                    readerWindowReference.postMessage({ action: 'scrollReader', direction: 'up' }, '*');
                }
                return ''; 
            }

            // KEYDEF: '.' (Dot) -> Remote Scroll Down reader window
            if (realKey === '.') {
                if (readerWindowReference && !readerWindowReference.closed) {
                    readerWindowReference.postMessage({ action: 'scrollReader', direction: 'down' }, '*');
                }
                return ''; 
            }
            
            // ============ KEYDEFS END ============
            // default is let the key pass through
            return realKey;
        },
        configurable: true
    });
})();

//=============================================================================
// More visible Prev/Next article links
// Handles layout modifications and DOM updates
function runMinifluxLayoutTweaks() {
    // Only target single article views
    if (/\/entry\//.test(window.location.pathname)) {
        // Find the main article H1 header element
        const titleHeader = document.getElementById('page-header-title');
        const nextLink = document.querySelector('a[data-page="next"]');
        // Check if both elements are present and prevent duplicate injections
        if (titleHeader && nextLink && !document.querySelector('.top-next-link-container')) {
            const container = document.createElement('div');
            container.className = 'top-next-link-container';
            
            // Extract the title text string from the link attribute
            const nextTitleText = nextLink.getAttribute('title');
            
            if (nextTitleText) {
                // Insert the title text into our container
                container.textContent = "Next: " + nextTitleText;
                // Insert it right after the <h1> tag
                titleHeader.parentNode.insertBefore(container, titleHeader.nextSibling);
            }
        }
    }
}

// Ensure the page setup checks fire cleanly across SPA rendering switches
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runMinifluxLayoutTweaks);
} else {
    runMinifluxLayoutTweaks();
}

// Observe page mutation changes to automatically adapt top header links on new entries
const layoutObserver = new MutationObserver(() => {
    // Only re-inject if our top layout holder doesn't already exist on screen
    if (!document.querySelector('.top-next-link-container')) {
        runMinifluxLayoutTweaks();
    }
});
layoutObserver.observe(document.body, { childList: true, subtree: true });

//=============================================================================
// Enable thumbnails, by capsuleman
// https://github.com/miniflux/v2/issues/766#issuecomment-3449003220
const makeThumb = (src) => {
  const img = document.createElement("img");
  img.src = src;
  img.style.float = "right";
  img.style.height = "100px";
  img.style.marginLeft = "5px";
  return img;
};

const fetchUser = async () => {
  const response = await fetch("/v1/me");
  return response.json();
};

const fetchAllEntries = async (params) => {
  const response = await fetch(`/v1/entries?${params.toString()}`);
  const data = await response.json();
  return data.entries;
};

const fetchCategoryEntries = async (categoryId, params) => {
  const response = await fetch(
    `/v1/categories/${categoryId}/entries?${params.toString()}`
  );
  const data = await response.json();
  return data.entries;
};

const fetchFeedEntries = async (feedId, params) => {
  const response = await fetch(
    `/v1/feeds/${feedId}/entries?${params.toString()}`
  );
  const data = await response.json();
  return data.entries;
};

const getEntries = async () => {
  const currentUser = await fetchUser();

  const params = new URLSearchParams({
    limit: currentUser.entries_per_page,
    order: currentUser.entry_sorting_order,
    direction: currentUser.entry_sorting_direction,
    offset: new URLSearchParams(window.location.search).get("offset") ?? 0,
  });

  const currentPage = document.location.pathname;
  if (currentPage === "/unread") {
    params.set("status", "unread");
    return fetchAllEntries(params);
  }
  if (currentPage === "/starred") {
    params.set("starred", true);
    return fetchAllEntries(params);
  }
  if (currentPage === "/history") {
    // https://github.com/miniflux/v2/blob/7e2dd3afe64b3fad4de149d2a993c8e890d5db27/internal/ui/history_entries.go#L26
    params.set("status", "read");
    params.set("direction", "desc");
    params.set("order[]", "changed_at");
    params.set("order[]", "published_at");
    return fetchAllEntries(params);
  }

  const matchResult = currentPage.match(
    "^/(feed|category)/([0-9]+)/entries(/all)?$"
  );

  if (matchResult) {
    const [_, type, id, all] = matchResult;

    if (!all) {
      params.set("status", "unread");
    }

    if (type === "category" && id) {
      return fetchCategoryEntries(id, params);
    }

    if (type === "feed" && id) {
      return fetchFeedEntries(id, params);
    }
  }

  return [];
};

const entries = await getEntries();

entries.forEach((entry) => {
  const imageEnclosure = entry.enclosures.find((enclosure) =>
    enclosure.mime_type.startsWith("image/")
  );
  if (!imageEnclosure) return;

  const thumb = makeThumb(imageEnclosure.url);
  const item = document.querySelector(`[data-id="${entry.id}"]`);
  item.prepend(thumb);
});

// paste this in the Miniflux settings page, Application Settings / Custom JavaScript 
// 'b' acts as 'v' on view: Open original link
// ' ' on an article:
//    - if the page contents fits in the window (no scroll), emit 'v' (Open original link)
//    - if the page can scroll down, scroll down
//    - if we are at the bottom, emit 'j' (Go to next item)
// 'n' first scroll the current article, then go to next one
// 'u' scrools up by half a page

(function() {
    // Intercept the keyboard event at the root prototype level before ANY listener fires
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
            // CHECK 3: We are in a 'view unread' window
            if (! /^\/unread(\/|$)/.test(window.location.pathname)) {
                return realKey;
            }

            // ============ KEYDEFS START ============
            
            // KEYDEF: 'b' synonym of 'v' go to the original article
            if (realKey === 'b') {
                return 'v';
            }
            
            // KEYDEF: 'u' Half-Page Scroll Up
            if (realKey === 'u') {
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                // Do nothing if no vertical scroll bars
                if (scrollHeight <= clientHeight) {
                    return '';
                }
                // Otherwise, manually scroll up by exactly half the viewport height
                window.scrollBy({
                    top: -(clientHeight / 2),
                    behavior: 'smooth' // 'auto' or 'smooth' for animated glide scroll
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
                // The page has scroll bars. next item if we are already at the bottom.
                // We use a 2px buffer to handle browser sub-pixel rounding safely.
                const isAtBottom = (clientHeight + scrollTop >= scrollHeight - 2);
                if (isAtBottom) {
                    return 'j';
                }
                // Otherwise, return ' ' to let the browser execute the native scroll.
                return ' ';
            }

            // KEYDEF: ' ' Smart Space either scrolls down, or go to the original article, or next item
            if (realKey === ' ') {
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                // no vertical scroll bars at all, view original
                if (scrollHeight <= clientHeight) {
                    return 'v';
                }
                // The page has scroll bars. next item if we are already at the bottom.
                // We use a 2px buffer to handle browser sub-pixel rounding safely.
                const isAtBottom = (clientHeight + scrollTop >= scrollHeight - 2);
                if (isAtBottom) {
                    return 'j';
                }
                // Otherwise, return ' ' to let the browser execute the native scroll.
                 return realKey;
            }
            
            // ============ KEYDEFS END ============
            // default is passthrough
            return realKey;
        },
        configurable: true
    });
})();

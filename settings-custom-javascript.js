// paste this in the Miniflux settings page, Application Settings / Custom JavaScript 
// 'b' acts as 'v' on view: Open original link
// ' ' on an article:
//    - if the page contents fits in the window (no scroll), emit 'v' (Open original link)
//    - if the page can scroll down, scroll down

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

            // REDEFINES
            // b ==> v
            if (realKey === 'b') {
                return 'v';
            }
            // Space either scrolls down, or go to the original article
            if (realKey === ' ') {
                // If the content fits exactly within the viewport (no vertical scrollbar), space ==> v
                if (document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
                    // No scrollbar exists: rewrite Space to 'v'
                    return 'v';
                }
            }
            // default is passthrough
            return realKey;
        },
        configurable: true
    });
})();

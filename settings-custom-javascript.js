v// paste this in the Miniflux settings page, Application Settings / Custom JavaScript 
// 'b' acts as 'v' on view: Open original link
// ' ' on an article:
//    - if the page contents fits in the window (no scroll), emit 'v' (Open original link)
//    - if the page can scroll down, scroll down
//    - if we are at the bottom, emit 'j' (Go to next item)

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
            
            // KEDEF: b ==> v
            if (realKey === 'b') {
                return 'v';
            }

            // KEYDEF: '' Smart Space either scrolls down, or go to the original article, or next item
            if (realKey === ' ') {
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;

                // 1. Check if the page has no vertical scroll bars at all
                if (scrollHeight <= clientHeight) {
                    return 'v';
                }

                // 2. The page has scroll bars. Check if we are already at the bottom.
                // We use a 2px buffer to handle browser sub-pixel rounding safely.
                const isAtBottom = (clientHeight + scrollTop >= scrollHeight - 2);
                if (isAtBottom) {
                    return 'j'; // Go to next item natively via Miniflux's 'j'
                }

                // 3. Otherwise, the page has scroll bars and can still scroll down.
                // Return ' ' normally to let the browser execute the native scroll.
                return realKey;
            }
            
            // ============ KEYDEFS END ============
            // default is passthrough
            return realKey;
        },
        configurable: true
    });
})();

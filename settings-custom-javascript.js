// paste this in the Miniflux settings page, Application Settings / Custom JavaScript 
// 'b' acts as 'v' on view: Open original link
// ' ' on an article:
//    - if the page contents fits in the window (no scroll), emit 'v' (Open original link)
//    - if the page can scroll down, scroll down natively
//    - if we are at the bottom, emit 'j' (Go to next item)
// 'n' manually scrolls down by a page layout step, or jumps to next item if at the bottom
// 'i' scrolls up by half a page
// 'u' Undoes 'j' by emitting [g h j j o] across the page navigation barrier

(function() {
    // === MACRO RESUMPTION: Check if we just navigated via the 'u' key undo command ===
    const pendingUndo = sessionStorage.getItem('miniflux_undo_macro');
    if (pendingUndo) {
        sessionStorage.removeItem('miniflux_undo_macro'); // Clean up state immediately
        
        const followUpSequence = ['j', 'j', 'o'];
        let macroDelay = 250; // Give the server-rendered DOM time to completely settle

        followUpSequence.forEach((char) => {
            setTimeout(() => {
                const macroEvent = new KeyboardEvent('keydown', {
                    key: char,
                    bubbles: true,
                    cancelable: true
                });
                (document.activeElement || window).dispatchEvent(macroEvent);
            }, macroDelay);
            macroDelay += 120;
        });
    }

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

            // ============ KEYDEFS START ============
            
            // KEYDEF: 'b' synonym of 'v' go to the original article
            if (realKey === 'b') {
                return 'v';
            }
            
            // KEYDEF: 'i' Half-Page Scroll Up
            if (realKey === 'i') {
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
                
                if (scrollHeight <= clientHeight) {
                    return 'j';
                }
                const isAtBottom = (clientHeight + scrollTop >= scrollHeight - 5);
                if (isAtBottom) {
                    return 'j';
                }
                
                // FIX: Manually execute the scroll since returning ' ' doesn't trigger native scrolling
                window.scrollBy({
                    top: clientHeight - 40, // Scroll down one full viewport minus a small comfortable buffer
                    behavior: 'auto'
                });
                return ''; // Swallow 'n' completely so Miniflux doesn't catch it
            }

            // KEYDEF: ' ' Smart Space either scrolls down natively, goes to original article, or next item
            if (realKey === ' ') {
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                
                if (scrollHeight <= clientHeight) {
                    return 'v';
                }
                const isAtBottom = (clientHeight + scrollTop >= scrollHeight - 5);
                if (isAtBottom) {
                    return 'j';
                }
                return realKey; // Return real space so the browser executes its native hardware scroll
            }

            // KEYDEF: 'u' Undoes 'j' by saving execution state and firing initial navigation
            if (realKey === 'u') {
                sessionStorage.setItem('miniflux_undo_macro', 'true');
                
                const targetNode = document.activeElement || window;

                // Fire 'g' instantly
                targetNode.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true, cancelable: true }));
                
                // Fire 'h' right behind it to complete the Miniflux navigation request
                setTimeout(() => {
                    targetNode.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true, cancelable: true }));
                }, 15);

                return ""; 
            }
            
            // ============ KEYDEFS END ============
            return realKey;
        },
        configurable: true
    });
})();

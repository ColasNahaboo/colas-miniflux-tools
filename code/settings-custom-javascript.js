// paste this in the Miniflux settings, Application Settings / Custom JavaScript 
// 'b' acts as 'v' on view: Open original link
// ' ' on an article:
//    - if the page contents fits in the window (no scroll), emit 'v'
//    - if the page can scroll down, scroll down natively
//    - if we are at the bottom, emit 'j' (Go to next item)
// 'n' scrolls down the page, and jumps to next item when at the bottom
// 'i' scrolls up by half a page
// 'u' Undoes 'j' by emitting [g, h, j, j, o] to get prev item from history

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
            if (! /^\/(unread|history|entry)(\/|$)/.test(window.location.pathname)) {
                return realKey;
            }

            // ============ KEYDEFS START ============
            // This section is moodular: add/remove KEYDEFs blocks at will here
            
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

            // KEYDEF: ' ' Smart Space either
            // scrolls down natively, goes to original article, or go next item
            if (realKey === ' ') {
                const clientHeight = document.documentElement.clientHeight;
                const scrollHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                if (scrollHeight <= clientHeight) {
                    return 'v';
                }
                const atBottom = (clientHeight + scrollTop >= scrollHeight - 5);
                if (atBottom) {
                    return 'j';
                }
                return realKey; 
            }

            // KEYDEF: 'u' Undoes 'j' by emitting [g h j j o]
            // Since miniflux is a SPA, no need to manage document resets
            if (realKey === 'u') {
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
                return ""; // swallow the original 'u' key execution
            }
            
            // ============ KEYDEFS END ============
            // default is let the key pass through
            return realKey;
        },
        configurable: true
    });
})();

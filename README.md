# colas-miniflux-tools
The tools I use on [Miniflux](https://miniflux.app/)

I started using a self-hosted Miniflux on 2026-06-16. I was using a self-hosted [FreshRSS](https://www.freshrss.org/) before, which was very nice, but was doing a lot of things I did not need.

Recently I migrated my personal website to [Zola](https://www.getzola.org/), and I was more and more convinced that minimalist, opinionated, and one single binary was the way to go. So I decided to switch to Miniflux.

I will publish here the various small tools I am sure to develop for my personal use of Miniflux. Feel free, to use, copy, modify, criticize, discuss...

## Redefining Keys

The keyboard shortcuts are built-in in Miniflux in [app.js](https://github.com/miniflux/v2/blob/530b0c5739b6757497ee14c91d95ca20ec32b643/internal/ui/static/js/app.js#L1174), so I coded (with brainstorms with Gemini) a system to (re)define keys via copying some JS code into Miniflux user settings.

Copy the contents of the `code/settings-custom-javascript.js` file into Miniflux settings, in the Custom JavaScript input field of the "Application Settings" section, and click Update below it.

This file defines or redefines keyboard shortcuts in a modular way: each key is handled in its own `// KEYDEF:` block that you can remove at will or add yours.

Currently what it does is:
- **b** acts as a synonym for 'v' to "Open original link". This is because hitting b felt more natural to reach from my right hand on the home row.
- **space** becomes context-dependent when reading an article:
  - if the page contents fits in the window (no scrollbars visible), emit 'v' to "Open original link". This because when a item is short, most probably there is much more to read at the original link. 
  - if the page can scroll down, scroll down normally.
  - if we are at the bottom, emit 'j' (Go to next item). I consider that if the RSS contents was big enough, there was no more to read on the original article.
- **n** scrolls down the page, and jumps to next item when at the bottom. So now, 'j' unconditionally go to the next item, but 'n' lets you read the current one firrst.
- **i** scrolls up by half a page. Useful in combination with space that scrolls down by a full page, to read cartoons that often sit across the fold.
- **u** Undoes 'j' by emitting [g, h, j, j, o] to go to the previous item. We cannot use 'k' in unread mode, since the previous item is now read and not available anymore in the unread view. So 'u' goes through the history page to look for it.

But it will surely evolve as I become more and more familiar with Miniflux.

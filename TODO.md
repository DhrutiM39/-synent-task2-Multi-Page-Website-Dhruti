# TODO - Responsive Testing & Fixes

## Original pass: responsive/perf/a11y sweep
- [x] Audit responsive/tap/performance risks from markup + CSS + JS.
- [x] Make responsive UI fixes in `style.css`.
- [x] Ensure mobile tap targets are >= 44px height for navbar toggle, testimonial buttons, tabs/buttons.
- [x] Prevent mobile overflow (hero/canvas, marquee text, footer links).
- [x] Improve timeline layout stacking behavior on mobile.
- [x] Make performance/accessibility guards in `script.js`.
- [x] Add reduced-motion support for steam animation + marquee pause.
- [x] Reduce canvas particle work on small screens.
- [x] Add safety checks for missing elements on pages.

## Second pass: bug fixes + missing features (this round)
- [x] Fixed broken team photos on `about.html` — `src` attributes referenced
      `Quality lead.jpg` / `brew bar manager.jpg` (spaces) but the actual files
      are `Quality_lead.jpg` / `brew_bar_manager.jpg` (underscores). Would 404
      on any case/character-sensitive host.
- [x] Added "Order" to the main nav and footer nav on every page, with correct
      `active` state per page.
- [x] Fixed `contact.html` footer dropping the "Contact" link entirely.
- [x] Fixed `order.html` footer incorrectly marking "Menu" as active.
- [x] Built out `order.html` into a real ordering page: category tabs, item
      grid with quantity steppers, live cart summary with subtotal, and a
      simulated "Place Order" flow (`OrderPage` class in `script.js`).
- [x] Built out `review.html` into a real review page: star-rating form with
      validation, and a list of reviews that a new submission gets prepended
      to live (`ReviewForm` class in `script.js`).
- [x] Wired up the Services page category tabs, which previously only
      toggled a visual active state and did nothing. Added `data-category`
      to tabs and cards and a `ServiceFilter` class (replacing the old inert
      `CategoryTabs`) so tabs now actually filter the grid.
- [x] Added a second CSS breakpoint at 480px for finer control over hero
      text, the steam canvas, the roast marquee, timeline dots, and the new
      order/review components on small phones.

## Re-tested after changes (via jsdom harness + manual read-through)
- [x] Navbar hamburger toggle works.
- [x] Contact form validation + simulated submit works, no console errors.
- [x] Services tabs now filter the grid (verified: clicking "Pastries" shows
      only the Daily Pairings card).
- [x] Order page: quantity steppers update the cart and subtotal correctly,
      "Place Order" button enables/disables based on cart state.
- [x] Review page: submitting a valid review prepends a new review card to
      the list and resets the form.
- [x] All 7 pages load with zero script errors (checked via headless DOM run).

## Still worth doing before a real launch
- [ ] Replace placeholder social links (`href="#"`) with real Instagram/
      Facebook URLs.
- [ ] Wire the contact form and order/review forms to an actual backend or
      form service — they currently simulate submission with `setTimeout`
      and don't send data anywhere.
- [ ] Manual visual QA on a real phone (375px/414px) for the new order and
      review layouts.

/**
 * DOM fixture — representative HTML snapshot of a LinkedIn saved-posts card.
 *
 * Captured from the entity-result layout used on /my-items/saved-posts.
 * Use this in scraper tests to verify parseCard behavior without hitting LinkedIn.
 *
 * Update this fixture when LinkedIn changes their DOM structure.
 */

/**
 * A single entity-result card with all expected fields present.
 */
export const FULL_CARD_HTML = `
<div data-chameleon-result-urn="urn:li:activity:7100000000000000001" class="entity-result">
  <div class="linked-area">
    <a href="https://www.linkedin.com/in/johndoe/" class="app-aware-link">
      <span dir="ltr"><span aria-hidden="true">John Doe</span></span>
    </a>
    <div class="t-14 t-black t-normal">Senior Software Engineer at Acme Corp</div>
    <p class="t-black--light t-12"><span aria-hidden="true">2d</span></p>
  </div>
  <div class="presence-entity__image-wrapper">
    <img class="presence-entity__image" src="https://media.licdn.com/avatar/johndoe.jpg" alt="John Doe" />
  </div>
  <div class="entity-result__summary entity-result__summary--2-lines">
    Building the future of #AI and #MachineLearning — here's what I learned scaling our inference pipeline to 10M requests/day. Key takeaway: batching is everything.
  </div>
</div>
`;

/**
 * A card with minimal fields — no avatar, no headline, no hashtags.
 */
export const MINIMAL_CARD_HTML = `
<div data-chameleon-result-urn="urn:li:activity:7100000000000000002" class="entity-result">
  <div class="linked-area">
    <a href="https://www.linkedin.com/in/janedoe/" class="app-aware-link">
      <span dir="ltr"><span aria-hidden="true">Jane Doe</span></span>
    </a>
  </div>
  <div class="entity-result__summary">
    Interesting thoughts on remote work culture and productivity in 2025.
  </div>
</div>
`;

/**
 * A card with no content at all — should be skipped by parseCard.
 */
export const EMPTY_CARD_HTML = `
<div data-chameleon-result-urn="urn:li:activity:7100000000000000003" class="entity-result">
  <div class="linked-area"></div>
</div>
`;

/**
 * A card without the URN attribute — tests ID fallback logic.
 */
export const NO_URN_CARD_HTML = `
<div class="entity-result">
  <div class="linked-area">
    <a href="https://www.linkedin.com/in/bobsmith/" class="app-aware-link">
      <span dir="ltr"><span aria-hidden="true">Bob Smith</span></span>
    </a>
    <div class="t-14 t-black t-normal">Product Manager</div>
  </div>
  <div class="entity-result__summary">
    Great discussion about product-led growth strategies. The funnel metaphor is dead.
  </div>
</div>
`;

/**
 * A full page containing multiple cards — used for integration-style scraper tests.
 */
export const MULTI_CARD_PAGE_HTML = `
<div class="scaffold-finite-scroll__content">
  <ul>
    <li>${FULL_CARD_HTML}</li>
    <li>${MINIMAL_CARD_HTML}</li>
    <li>${EMPTY_CARD_HTML}</li>
    <li>${NO_URN_CARD_HTML}</li>
  </ul>
</div>
`;

/**
 * A card with XSS-attempt content — used for sanitization tests (Phase 5).
 */
export const XSS_CARD_HTML = `
<div data-chameleon-result-urn="urn:li:activity:7100000000000000004" class="entity-result">
  <div class="linked-area">
    <a href="https://www.linkedin.com/in/attacker/" class="app-aware-link">
      <span dir="ltr"><span aria-hidden="true">Attacker</span></span>
    </a>
  </div>
  <div class="entity-result__summary">
    Check this out <script>alert('xss')</script> and also <img onerror="alert(1)" src="x">
  </div>
</div>
`;

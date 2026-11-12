// Shared helpers for the flows (not a flow: the QA runs only *.flow.mjs).

/** Scrolls so a beat section's top sits at the viewport's top, then waits two frames. */
export async function scrollToBeat(page, n) {
  await page.evaluate((n) => {
    const el = document.querySelector(`[data-beat="${n}"]`);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 64);
  }, n);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** The plate shown on the stage (the one with .is-on), 1–4. */
export const plateOn = (page) => page.evaluate(() => Number(document.querySelector('[data-plate].is-on')?.getAttribute('data-plate')));

/** A phone number, an e-mail or a WhatsApp link: what the brief keeps off every page. */
export const CONTACT = /mailto:|tel:|wa\.me|whatsapp\.com|[\w.+-]+@[\w-]+\.[a-z]{2,}|\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/i;

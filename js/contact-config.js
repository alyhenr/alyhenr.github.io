/*
 * contact-config.js (module): the contact form's one config place.
 *
 * Deploy day changes two values here and nothing else: GATEWAY_URL (the Gateway's base URL, no
 * path) and TURNSTILE_SITE_KEY (the real key; this one is Cloudflare's always-pass test key).
 * While GATEWAY_URL is empty the form validates and says the request was not sent, and Turnstile
 * is never loaded.
 */
export const GATEWAY_URL = '';
export const FORM_KEY = 'pk_portfolio_LAEYLkgWxfNmgOQbevE3';
export const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';

/*
 * site.js: the parts every round-2 direction shares, the same file in each folder
 * (the QA's `directions` step checks the copies match and tests the estimate).
 *
 *   CATALOGUE   the four ready packages and the calculator's figures (provisional, below)
 *   estimate()  what a choice of pages and features costs and takes
 *   the page    [data-money] / [data-days] prices, the calculator ([data-calc]), the
 *               "levar para o contato" buttons, and the contact form ([data-contact])
 *
 * No contact endpoint yet: the form validates and stops. No phone number or e-mail anywhere.
 */
(function (root) {
  'use strict';

  // PROVISÓRIO: os valores do catálogo da agência (prices.json, reais inteiros) entram aqui.
  // Os pacotes custam menos que as mesmas peças somadas na calculadora, de propósito.
  var CATALOGUE = {
    launch: true, // mostra "preço de lançamento" nos pacotes
    provisional: true,
    base: { price: 690, days: 5, label: '1 página, formulário de contato, pronto para celular' },
    extraPage: { price: 180, days: 1 },
    maxPages: 12,
    features: {
      galeria: { label: 'Galeria de fotos', price: 220, days: 2 },
      mapa: { label: 'Mapa e horários', price: 0, days: 0 },
      cardapio: { label: 'Cardápio ou catálogo', price: 380, days: 3 },
      agendamento: { label: 'Agendamento on-line', price: 650, days: 4 },
      blog: { label: 'Blog ou novidades', price: 420, days: 3 },
      dominio: { label: 'Domínio .com.br configurado', price: 90, days: 1 },
    },
    packages: {
      essencial: { name: 'Essencial', price: 690, days: 5, pages: 1, features: ['mapa'] },
      vitrine: { name: 'Vitrine', price: 1290, days: 10, pages: 4, features: ['galeria', 'mapa', 'dominio'] },
      agenda: { name: 'Agenda', price: 1990, days: 15, pages: 5, features: ['galeria', 'mapa', 'agendamento', 'dominio'] },
      completo: { name: 'Completo', price: 2890, days: 20, pages: 8, features: ['galeria', 'mapa', 'cardapio', 'agendamento', 'blog', 'dominio'] },
    },
  };

  function money(n) {
    return 'R$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /** The cheapest package that covers the choice, or null. */
  function bestPackage(choice, cat) {
    cat = cat || CATALOGUE;
    var best = null;
    Object.keys(cat.packages).forEach(function (id) {
      var p = cat.packages[id];
      var covers = p.pages >= choice.pages && choice.features.every(function (f) { return p.features.indexOf(f) !== -1; });
      if (covers && (!best || p.price < best.price)) best = { id: id, name: p.name, price: p.price, days: p.days };
    });
    return best;
  }

  /** choice: { pages: 1..maxPages, features: [ids] } → { pages, features, price, days, package }. */
  function estimate(choice, cat) {
    cat = cat || CATALOGUE;
    var pages = Math.max(1, Math.min(cat.maxPages, Math.round(Number(choice.pages) || 1)));
    var features = (choice.features || []).filter(function (f) { return cat.features[f]; });
    var price = cat.base.price + (pages - 1) * cat.extraPage.price;
    var days = cat.base.days + (pages - 1) * cat.extraPage.days;
    features.forEach(function (f) { price += cat.features[f].price; days += cat.features[f].days; });
    var pkg = bestPackage({ pages: pages, features: features }, cat);
    return { pages: pages, features: features, price: price, days: days, package: pkg && pkg.price < price ? pkg : null };
  }

  /** The line the form carries: what was chosen, the figure, and that it is an estimate. */
  function summary(est, cat) {
    cat = cat || CATALOGUE;
    var names = est.features.map(function (f) { return cat.features[f].label; });
    var parts = [est.pages + (est.pages === 1 ? ' página' : ' páginas')].concat(names);
    var line = 'Calculadora: ' + parts.join(', ') + '. Cerca de ' + money(est.price) + ', em uns ' + est.days + ' dias úteis.';
    if (est.package) line += ' O pacote ' + est.package.name + ' cobre isso por ' + money(est.package.price) + '.';
    return line + ' (É uma estimativa.)';
  }

  function packageSummary(id, cat) {
    cat = cat || CATALOGUE;
    var p = cat.packages[id];
    if (!p) return '';
    return 'Pacote ' + p.name + ': ' + money(p.price) + (cat.launch ? ' (preço de lançamento)' : '') + ', em uns ' + p.days + ' dias úteis.';
  }

  /** E-mail, or a phone number with DDD (10 or 11 digits, +55 allowed). */
  function validContact(v) {
    v = String(v || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
    var digits = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    return /^[\d\s()+.-]+$/.test(v) && digits.length >= 10 && digits.length <= 11;
  }

  var api = { CATALOGUE: CATALOGUE, money: money, estimate: estimate, bestPackage: bestPackage, summary: summary, packageSummary: packageSummary, validContact: validContact };
  root.Site = api;
  if (typeof document === 'undefined') return;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function fillPrices() {
    $$('[data-money]').forEach(function (el) {
      var k = el.getAttribute('data-money').split(':');
      var v = k[0] === 'pkg' ? CATALOGUE.packages[k[1]].price : k[0] === 'feat' ? CATALOGUE.features[k[1]].price : CATALOGUE[k[0]].price;
      el.textContent = v === 0 && k[0] === 'feat' ? 'incluso' : money(v);
    });
    $$('[data-days]').forEach(function (el) {
      var k = el.getAttribute('data-days').split(':');
      el.textContent = k[0] === 'pkg' ? CATALOGUE.packages[k[1]].days : CATALOGUE[k[0]].days;
    });
    $$('[data-launch]').forEach(function (el) { el.hidden = !CATALOGUE.launch; });
    $$('[data-provisional]').forEach(function (el) { el.hidden = !CATALOGUE.provisional; });
  }

  var current = null;

  function readCalc(form) {
    var pages = form.querySelector('[name="pages"]');
    return {
      pages: pages ? pages.value : 1,
      features: $$('[name="feat"]:checked', form).map(function (i) { return i.value; }),
    };
  }

  function renderCalc(form) {
    var est = estimate(readCalc(form));
    current = est;
    var out = function (k) { return $$('[data-out="' + k + '"]'); };
    out('price').forEach(function (el) { el.textContent = money(est.price); });
    out('days').forEach(function (el) { el.textContent = est.days; });
    out('pages').forEach(function (el) { el.textContent = est.pages; });
    out('pages-word').forEach(function (el) { el.textContent = est.pages === 1 ? 'página' : 'páginas'; });
    out('hint').forEach(function (el) {
      el.textContent = est.package ? 'O pacote ' + est.package.name + ' cobre isso por ' + money(est.package.price) + '.' : '';
      el.hidden = !est.package;
    });
    out('lines').forEach(function (ul) {
      ul.innerHTML = '';
      var add = function (label, value) {
        var li = document.createElement('li');
        var a = document.createElement('span'); a.textContent = label;
        var b = document.createElement('span'); b.textContent = value;
        li.appendChild(a); li.appendChild(b); ul.appendChild(li);
      };
      add(est.pages + (est.pages === 1 ? ' página' : ' páginas'), money(CATALOGUE.base.price + (est.pages - 1) * CATALOGUE.extraPage.price));
      est.features.forEach(function (f) {
        var x = CATALOGUE.features[f];
        add(x.label, x.price ? money(x.price) : 'incluso');
      });
    });
    var pages = form.querySelector('[name="pages"]');
    if (pages) {
      $$('[data-step]', form).forEach(function (b) {
        var d = Number(b.getAttribute('data-step'));
        b.disabled = d < 0 ? est.pages <= 1 : est.pages >= CATALOGUE.maxPages;
      });
    }
    document.dispatchEvent(new CustomEvent('estimate:change', { detail: est }));
  }

  function setEstimate(text) {
    var form = $('[data-contact]');
    if (!form) return;
    var field = form.querySelector('[name="estimativa"]');
    field.value = text;
    var clear = form.querySelector('[data-clear-estimate]');
    if (clear) clear.hidden = !text;
    var wrap = form.querySelector('[data-estimate-field]');
    if (wrap) wrap.classList.toggle('has-estimate', !!text);
  }

  function goToForm() {
    var form = $('[data-contact]');
    if (!form) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (form.closest('section') || form).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var first = $$('input, textarea', form).filter(function (i) { return !i.readOnly && !i.value; })[0];
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 450);
  }

  function wireCalc() {
    $$('[data-calc]').forEach(function (form) {
      var pages = form.querySelector('[name="pages"]');
      if (pages) pages.max = CATALOGUE.maxPages;
      form.addEventListener('input', function () { renderCalc(form); });
      form.addEventListener('change', function () { renderCalc(form); });
      form.addEventListener('submit', function (e) { e.preventDefault(); });
      $$('[data-step]', form).forEach(function (b) {
        b.addEventListener('click', function () {
          pages.value = Math.max(1, Math.min(CATALOGUE.maxPages, Number(pages.value) + Number(b.getAttribute('data-step'))));
          renderCalc(form);
        });
      });
      renderCalc(form);
    });
    $$('[data-use-estimate]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!current) return;
        setEstimate(summary(current));
        goToForm();
      });
    });
    $$('[data-pick]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        setEstimate(packageSummary(b.getAttribute('data-pick')));
        goToForm();
      });
    });
  }

  function wireForm() {
    var form = $('[data-contact]');
    if (!form) return;
    var status = form.querySelector('[data-form-status]');
    var clear = form.querySelector('[data-clear-estimate]');
    if (clear) clear.addEventListener('click', function () { setEstimate(''); });
    var err = function (name, msg) {
      var p = form.querySelector('[data-error-for="' + name + '"]');
      var input = form.querySelector('[name="' + name + '"]');
      if (p) p.textContent = msg || '';
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
      return !msg;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return String(form.querySelector('[name="' + n + '"]').value || '').trim(); };
      var ok = [
        err('nome', v('nome') ? '' : 'Escreva seu nome.'),
        err('contato', validContact(v('contato')) ? '' : 'Escreva um e-mail ou um telefone com DDD.'),
        err('mensagem', v('mensagem') || v('estimativa') ? '' : 'Conte em uma frase o que o site precisa fazer.'),
      ].every(Boolean);
      if (!ok) {
        status.textContent = 'Falta pouco: veja os campos marcados.';
        status.className = 'form-status is-error';
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      status.textContent = 'Pronto, ' + v('nome').split(' ')[0] + '. No site de verdade, isto chega até mim e eu respondo em até 1 dia útil. (Mockup: nada foi enviado.)';
      status.className = 'form-status is-done';
      form.classList.add('is-sent');
    });
    $$('input, textarea', form).forEach(function (i) {
      i.addEventListener('input', function () { if (i.getAttribute('aria-invalid')) err(i.name, ''); });
    });
  }

  function start() {
    fillPrices();
    wireCalc();
    wireForm();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : globalThis);

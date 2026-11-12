// The calculator quotes on the agency's catalogue as you tick, labelled as an estimate, and hands
// its line to the contact form; a ready package does the same with its price.
export const flow = {
  name: 'the calculator recomputes the estimate and carries it into the contact form',
  async run({ page, go, expect, shot, step }) {
    await go('/#calculadora');
    const calc = page.locator('[data-calc]');
    const total = page.locator('.quote [data-out="total"]');
    await calc.locator('input[name="tier"]').first().waitFor();
    expect((await calc.locator('input[name="tier"]').count()) === 4, 'the calculator does not offer the 4 tiers');
    expect((await calc.locator('input[name="addon"]').count()) === 10, 'the calculator does not offer the 10 add-ons');
    // The default: Site institucional + galeria (250) + formulário (200) + domínio (80).
    expect((await total.textContent()) === 'R$ 1.730', `the default estimate is ${await total.textContent()}`);
    await page.getByText('É uma estimativa. Conte seu objetivo e fechamos o valor juntos.').waitFor();
    await page.locator('.quote').getByText('preço de lançamento').waitFor();

    step('Página única + agendamento moves to Site com recursos');
    const tier = (id) => calc.locator(`label.row:has(input[value="${id}"])`);
    const addon = (id) => calc.locator(`label.row:has(input[name="addon"][value="${id}"])`);
    await tier('pagina-unica').click();
    for (const id of ['galeria-gerenciavel', 'formulario-email', 'configuracao-dominio']) await addon(id).click();
    expect((await total.textContent()) === 'R$ 500', `Página única alone is ${await total.textContent()}`);
    await addon('agendamento-online').click();
    expect((await total.textContent()) === 'R$ 2.500', `Página única + agendamento is ${await total.textContent()}`);
    await page.locator('[data-out="moved"]').getByText('leva o site para Site com recursos').waitFor();
    await page.locator('.quote [data-out="lines"]').getByText('incluído').waitFor();
    await shot('calculadora');

    step('extra pages, English and urgency');
    await addon('agendamento-online').click();
    await tier('site-institucional').click();
    await calc.locator('[data-step="1"]').click();
    await calc.locator('[data-step="1"]').click();
    expect((await total.textContent()) === 'R$ 1.500', `Site institucional + 2 extra pages is ${await total.textContent()}`);
    await addon('versao-ingles').click();
    expect((await total.textContent()) === 'R$ 1.875', `…in English is ${await total.textContent()}`);
    await calc.locator('label.row:has(input[name="urgent"])').click();
    expect((await total.textContent()) === 'R$ 2.438', `…urgent is ${await total.textContent()}`);
    await page.locator('.quote [data-out="tier"]').getByText('cerca de 5 dias úteis').waitFor();

    step('Sistema sob medida reads "a partir de"');
    await tier('sistema-sob-medida').click();
    await page.locator('.quote [data-out="from"]').waitFor();

    step('the estimate goes to the form');
    await tier('site-institucional').click();
    await page.locator('[data-use-estimate]').click();
    const field = page.locator('textarea[name="estimativa"]');
    await page.waitForFunction(() => document.querySelector('textarea[name="estimativa"]').value.length > 0);
    const line = await field.inputValue();
    for (const s of ['Calculadora: Site institucional', 'Total R$ 2.438', 'preço de lançamento', 'É uma estimativa.']) expect(line.includes(s), `the form's estimate misses "${s}": ${line}`);
    await page.getByRole('button', { name: 'Tirar a estimativa' }).click();
    expect((await field.inputValue()) === '', 'the estimate was not cleared');

    step('a ready package goes to the form');
    await page.locator('[data-pick="site-com-recursos"]').click();
    await page.waitForFunction(() => document.querySelector('textarea[name="estimativa"]').value.startsWith('Pacote Site com recursos: R$ 2.500 (preço de lançamento)'));
  },
};

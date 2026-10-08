// Registo de emissao e painel ?dev (v4.0): o painel nao tapa o ecra de entrada; cada disco fica
// registado com o motivo do fim (fim natural com levantar, salto, erro); o CSV tem todas as
// colunas e o ano desconhecido sai vazio; o separador Banks mostra os 7 blocos. Cerca de 1 minuto.
'use strict';
const T = require('./lib/common');

function parseCsv(txt) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"' && txt[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; continue; }
    if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

(async () => {
  const t = T.suite('devlog');
  const browser = await T.launch();
  let before = null;
  const r = await T.openLiquid(browser, {
    mode: 'desktop', qs: '?dev&block=kingston', dur: 15, load: 800,
    beforeStart: async (page) => { before = await page.evaluate(() => document.getElementById('devPanel').classList.contains('on')); },
  });
  t.check('painel ?dev escondido antes de a emissao comecar', before === false, before);
  /* discos de 15 s: o 1.o acaba sozinho (~15 s), salto a meio do 2.o (22 s), erro a meio do 3.o (30 s) */
  await r.run(50, [{ at: 22, do: 'skip' }, { at: 30, do: 'errActive' }]);
  const res = await r.page.evaluate(() => ({
    on: document.getElementById('devPanel').classList.contains('on'),
    ends: HMPLOG.rows().map(x => x.end || ''),
    rows: HMPLOG.rows().map(x => ({ y: x.y })),
    cols: HMPLOG.cols, csv: HMPLOG.csv(),
  }));
  t.check('painel ?dev visivel com a emissao a tocar', res.on);
  const has = (p) => res.ends.some(e => e.startsWith(p));
  t.check('fim natural registado (lift)', has('lift'), res.ends.join(' '));
  t.check('salto registado (skip)', has('skip'), res.ends.join(' '));
  t.check('erro registado (error)', has('error'), res.ends.join(' '));
  const csv = parseCsv(res.csv);
  t.check('CSV: cabecalho com todas as colunas', csv[0] && csv[0].length === res.cols.length, csv[0] && csv[0].length + ' vs ' + res.cols.length);
  const badRows = csv.slice(1).filter(x => x.length !== res.cols.length);
  t.check('CSV: todas as linhas com o mesmo numero de campos', csv.length > 1 && badRows.length === 0, badRows.length);
  const yi = res.cols.indexOf('year');
  t.check('CSV: ano nunca exportado como 0', csv.slice(1).every(x => x[yi] !== '0'), csv.slice(1).map(x => x[yi]).join(' '));
  const banks = await r.page.evaluate(async () => {
    const b = Array.from(document.querySelectorAll('#devTabs button, #devTabs [role="tab"]')).find(x => /banks/i.test(x.textContent));
    if (!b) return null;
    b.click(); await new Promise(res => setTimeout(res, 700));
    return document.getElementById('devPanel').textContent.toLowerCase();
  });
  const names = ['dawn', 'kingston', 'groove', 'flight', 'skank', 'pressure', 'after hours'];
  t.check('Banks: mostra os 7 blocos', banks && names.every(n => banks.includes(n)), banks ? names.filter(n => !banks.includes(n)).join(' ') : 'separador Banks nao encontrado');
  t.check('sem erros de JavaScript', r.errors.length === 0, r.errors.join(' | '));
  await r.close();
  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL devlog: excecao', e); process.exitCode = 1; });

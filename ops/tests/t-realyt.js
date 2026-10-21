// A emissao com o YouTube simulado ASSINCRONO, como o verdadeiro (lib/common.js, opcao ytAsync): as leituras
// da API sao copias que so mudam com a mensagem seguinte do leitor, o unMute com o volume a 0 poe-no em 5 e o
// seekTo com a musica a tocar passa pelo estado 3. Queixa do Paulo a 2026-10-21: «a musica para ao fim de um
// segundo; com o mute volta um segundo e para outra vez» (o primeiro disco ficava a volume 0; secao 15 do
// build-liquid.py). Verifica: o primeiro disco soa logo e no volume pedido, sem cair; mute e unmute; a troca
// de disco; o telemovel; um leitor lento (mensagens a 60 ms, 1,5 s a carregar no seekTo); a sala de foco.
// Cerca de 4 minutos.
'use strict';
const T = require('./lib/common');

// amostra o estado verdadeiro dos leitores da radio a cada 100 ms (window.__players guarda o leitor do simulador)
const SAMPLE = `(() => { window.__aud = []; window.__t0 = performance.now(); setInterval(() => { try {
  const k = HMENG.state().active, p = __players['yt' + k], o = __players['yt' + (k === 'A' ? 'B' : 'A')];
  const au = (x) => !!(x && x.st === 1 && !x.mu && x.vol > 0);
  window.__aud.push({ s: (performance.now() - window.__t0) / 1000, k, a: au(p) || au(o), vol: au(p) ? p.vol : (au(o) ? o.vol : 0), rec: HMENG.state().rec });
} catch (e) {} }, 100); })()`;

const take = (L) => L.page.evaluate(() => window.__aud);
// primeiro instante audivel em [a, b] (s), ou null
const firstAud = (A, a, b) => { const x = A.find(r => r.s >= a && r.s <= b && r.a); return x ? +x.s.toFixed(1) : null; };
// maior silencio (s) em [a, b]
const longestSilence = (A, a, b) => {
  let run = 0, best = 0, prev = null;
  for (const r of A) { if (r.s < a || r.s > b) continue; if (!r.a) { run += prev == null ? 0.1 : (r.s - prev); best = Math.max(best, run); } else run = 0; prev = r.s; }
  return +best.toFixed(1);
};
// menor volume audivel em [a, b] (0 se houver silencio)
const minVol = (A, a, b) => { const v = A.filter(r => r.s >= a && r.s <= b).map(r => (r.a ? r.vol : 0)); return v.length ? Math.min(...v) : 0; };

(async () => {
  const t = T.suite('realyt');
  const browser = await T.launch();

  // 1) computador: arranque, mute e unmute, troca de disco (discos de 45 s)
  {
    const L = await T.openLiquid(browser, { dur: 45, ytAsync: {} });
    await L.page.evaluate(SAMPLE);
    await L.run(60, [{ at: 20, do: 'mute' }, { at: 23, do: 'mute' }]);
    const A = await take(L);
    const f = firstAud(A, 0, 10);
    t.check('computador: o primeiro disco soa nos primeiros 3 s', f !== null && f <= 3, 'primeiro som aos ' + f + ' s');
    t.check('computador: no volume pedido (80) aos 6 s e sem cair ate ao mute', minVol(A, 6, 19.8) >= 72, 'volume minimo ' + minVol(A, 6, 19.8));
    t.check('computador: mute cala', longestSilence(A, 20.5, 22.8) >= 2, 'silencio ' + longestSilence(A, 20.5, 22.8) + ' s');
    t.check('computador: unmute volta a soar em menos de 1 s e no volume pedido ate a troca', firstAud(A, 23, 26) !== null && firstAud(A, 23, 26) <= 24 && minVol(A, 24.5, 38) >= 72,
      'som aos ' + firstAud(A, 23, 26) + ' s, volume minimo ' + minVol(A, 24.5, 38));
    // a troca: o disco acaba ~45 s depois de comecar; levantar, 2 s de sulco, pousar, musica
    const recS = A.filter(r => r.rec).map(r => r.s);
    const recEnd = recS.length ? Math.max(...recS) : null;
    t.check('computador: houve troca de disco', recEnd !== null, '');
    if (recEnd !== null) {
      const g = firstAud(A, recEnd - 0.5, 60);
      t.check('computador: o disco seguinte soa logo depois do pousar e no volume pedido', g !== null && g - recEnd <= 1.5 && minVol(A, g + 1, 59) >= 72,
        'fim do rito ' + recEnd.toFixed(1) + ' s, som aos ' + g + ' s, volume minimo ' + (g !== null ? minVol(A, g + 1, 59) : '-'));
    }
    t.check('computador: sem erros de JavaScript', L.errors.length === 0, L.errors.slice(0, 3).join(' | '));
    await L.close();
  }

  // 2) telemovel (um so leitor): o primeiro disco soa e fica
  {
    const L = await T.openLiquid(browser, { mode: 'mobile', dur: 300, ytAsync: {} });
    await L.page.evaluate(SAMPLE);
    await L.run(20);
    const A = await take(L);
    const f = firstAud(A, 0, 10);
    t.check('telemovel: o primeiro disco soa nos primeiros 3 s e fica no volume pedido (100)', f !== null && f <= 3 && minVol(A, 6, 19.5) >= 90,
      'primeiro som aos ' + f + ' s, volume minimo ' + minVol(A, 6, 19.5));
    await L.close();
  }

  // 3) leitor lento: mensagens a 60 ms, ordens a 30 ms, 1,5 s a carregar no seekTo do arranque
  {
    const L = await T.openLiquid(browser, { dur: 300, ytAsync: { cmd: 30, info: 60, ev: 20, seekBuf: 1500 } });
    await L.page.evaluate(SAMPLE);
    await L.run(20, [{ at: 12, do: 'mute' }, { at: 14, do: 'mute' }]);
    const A = await take(L);
    const f = firstAud(A, 0, 10);
    t.check('leitor lento: o primeiro disco soa nos primeiros 4 s e no volume pedido ate ao mute', f !== null && f <= 4 && minVol(A, 7, 11.8) >= 72,
      'primeiro som aos ' + f + ' s, volume minimo ' + minVol(A, 7, 11.8));
    t.check('leitor lento: depois do unmute fica a soar', minVol(A, 15.5, 19.5) >= 72, 'volume minimo ' + minVol(A, 15.5, 19.5));
    await L.close();
  }

  // 4) sala de foco: a radio cala de lado e volta no seu volume ao fechar
  {
    const L = await T.openLiquid(browser, { dur: 300, ytAsync: {} });
    await L.page.evaluate(SAMPLE);
    await L.run(34, [{ at: 6, do: 'focusOpen' }, { at: 20, do: 'focusClose' }]);
    const A = await take(L);
    t.check('sala de foco: a radio calada de lado (dos 9,5 aos 19,8 s)', longestSilence(A, 9.5, 19.8) >= 10, 'silencio ' + longestSilence(A, 9.5, 19.8) + ' s');
    t.check('sala de foco: ao fechar, a radio volta no volume pedido', minVol(A, 22, 33.5) >= 72, 'volume minimo ' + minVol(A, 22, 33.5));
    await L.close();
  }

  await browser.close();
  t.done();
})().catch(e => { console.error('FAIL realyt: excecao', e); process.exitCode = 1; });

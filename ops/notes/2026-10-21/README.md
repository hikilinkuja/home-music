# 2026-10-21: a música que parava ao fim de um segundo, e a abertura

Duas queixas do Paulo no mesmo dia: «why is the intro fucked up once again? countless times this happened» e
«music stops after playing for 1 second. when click mute it restarts for a second and then stops again».

Ficheiros desta pasta:
- `yt-api-probe.js`: mede o leitor verdadeiro do YouTube (secção 2);
- `compare-versions.js`: compara o som da emissão entre versões publicadas, com o YouTube simulado síncrono e
  assíncrono (secção 4).

## 1. A abertura

Facto: a faixa da abertura vinha em streaming do archive.org. A 2026-10-21, do GitHub Actions, o archive.org não
respondeu (uma tentativa presa cerca de 9 minutos; depois três ligações seguidas esgotadas aos 60 s, das 15h49 às
15h52 UTC), enquanto o freesound respondeu em 20 s; às 17h29 UTC voltou a responder e a faixa veio em 1,3 s. Os registos públicos de disponibilidade mostram quedas do
archive.org em agosto (16 a 25), setembro (15, 16, 17 e 20) e outubro (7) de 2026. Correção na v5.8: cópias no
próprio site (`sfx/`), o archive.org e o freesound só de reserva; pormenores no `4-diagnostico-introducao.md` da
pasta de 2026-10-08 (adenda) e no `sfx/LICENSES.md`.

## 2. A API do YouTube: o que se leu e o que se mediu

Lido no código (www-widgetapi.js, versão do leitor 67288f35, descarregado a 2026-10-21):
- as leituras `getPlayerState()`, `isMuted()`, `getVolume()` e `getCurrentTime()` devolvem `playerInfo`, uma cópia
  do estado do leitor que só muda quando chega uma mensagem `infoDelivery` do leitor (iframe);
- as ordens (`mute`, `unMute`, `setVolume`, `playVideo`, `seekTo`...) seguem por `postMessage` e não mexem nessa
  cópia;
- `loadVideoById` e `cueVideoById` apagam a cópia (`playerInfo={}`);
- o `onStateChange` é despachado sem mexer na cópia.

Medido no leitor verdadeiro (`yt-api-probe.js`, Chromium sem ecrã; sem vídeo, porque da nuvem o googlevideo.com
está bloqueado e os vídeos do catálogo dão erro 150, mas o estado do leitor responde):
- logo a seguir a cada ordem, a leitura dá o valor antigo (seis ordens, seis vezes); a cópia atualiza 2 a 3 ms
  depois, nesta máquina parada (numa página com animações pode demorar mais; não medido);
- `unMute()` com o volume a 0 põe o volume em 5 (duas vezes);
- dentro do `onStateChange`, o `getPlayerState()` já dava o estado novo (18 eventos, estados 3, -1 e 5);
- logo a seguir a `loadVideoById`, `getPlayerState()` e `isMuted()` dão `undefined`.

O YouTube simulado dos testes respondia a tudo na hora: não podia apanhar defeitos que dependam destas cópias.
Desde a v5.8 tem um modo assíncrono com estes comportamentos (`ytAsync` em `ops/tests/lib/common.js`; com
`HM_YT_ASYNC=1` no ambiente, todos os testes o usam).

## 3. O mecanismo (inferência apoiada nas medições e na reprodução)

1. No arranque, o motor põe o primeiro disco a volume 0, volta ao início (`seekTo(0)`), e o portão do som tira-lhe
   o mudo; 150 ms depois, a rampa de entrada (`rampInFirst`) pergunta se o leitor está a tocar e com som.
2. Se o leitor ainda estiver a carregar depois do `seekTo` (estado 3), ou se a pergunta chegar logo a seguir ao
   `unMute` (a cópia ainda diz «mudo»), a rampa fica à espera do portão (`firstRampWait`).
3. O portão só chamava a rampa no ramo em que tira o mudo, e aí relia o `isMuted()`, que logo a seguir ao
   `unMute` ainda dá «mudo»: a rampa voltava a esperar. Com o leitor já com som, o portão nunca mais a chamava.
4. O disco ficava com a rampa a 0 (`p.fade=0`). Na v5.7 o portão repõe sempre o volume do motor quando o leitor
   tem som, e o guarda do som (a cada 3 s, enquanto o volume estiver a 0) também: volume 0. Cada «Unmute» do Paulo
   tirava o mudo com o volume a 0, o YouTube punha-o em 5, e a música ouvia-se baixinha até ao toque seguinte do
   guarda (até 3 s), que repunha o 0. O rito da troca de disco limpa a espera, por isso o disco seguinte já soava.

Não observei o browser do Paulo: não há registo dele desta sessão. A sequência acima é a que o simulador
assíncrono reproduz com os comportamentos medidos, e dá o sintoma descrito.

## 4. Reprodução (`compare-versions.js`; segundos desde que a emissão liga; mute aos 30 s, unmute aos 33 s)

| Versão | YouTube simulado | Primeiro som | Depois do unmute |
|---|---|---|---|
| v5.7 publicada (c619c77) | síncrono (o antigo) | 0,2 s, sem cair | sem cair |
| v5.7 publicada | assíncrono (como o verdadeiro) | nenhum até ao unmute | 2,9 s de som (volume 5) e silêncio |
| v5.6 (0a28961) | assíncrono | 0,3 a 3,0 s (volume 5), depois silêncio | 2,9 s e silêncio |
| v5.0 (ad9ca8b, antes do portão do som) | assíncrono | 0,3 s, volume 80, sem cair | sem cair |
| v5.8 (corrigida) | assíncrono | 0,4 s, volume 80, sem cair | sem cair, volume 80 |
| v5.8 (corrigida) | síncrono | 0,2 s, sem cair | sem cair |

A v5.6 também falha no modelo e a v5.0 não: o defeito vem do portão do som da v5.1 (2026-10-18), que pôs a rampa
do primeiro disco à espera; a v5.7 mudou o resultado (silêncio em vez de três segundos baixinhos), não a causa.

## 5. Correção (secção 15 do `liquid/build-liquid.py`, v5.8)

- O portão corre a rampa que espera sempre que vê o prato no ar, a tocar e com som (tirado o mudo agora ou não),
  sem reler o `isMuted()`; a rampa recebe `opened` e não volta a perguntar.
- O volume do motor vai logo a seguir ao `unMute` (contra o volume 5 do YouTube).
- A rampa de entrada do rito corre mesmo que o leitor já tenha som.
- O guarda do som não briga com a rádio de lado e, como rede de segurança, corre a rampa do primeiro disco em
  falta; não mexe numa rampa que o portão acabou de lançar.
- Sala de foco (l07, não é motor): o leitor da sala repõe o volume logo a seguir ao `unMute`, para a música
  calada do intervalo não passar a volume 5 quando começa um disco novo.

Teste novo: `ops/tests/t-realyt.js` (12 verificações; na v5.7 publicada passam 5).

Segunda descoberta, com a bateria inteira no modo assíncrono (`HM_YT_ASYNC=1`): em 5 cenários do `t-ads`, o portão
tirava o mudo com o leitor no estado 3. O motor chamava o portão no mesmo instante em que mandava o leitor voltar
ao início (`seekTo(0)` no arranque e no pousar no prato do ar), e a cópia ainda dava o estado de antes (1). Não é
anúncio (o anúncio dá -1) e não se ouve nada a carregar, mas contraria a regra do portão. Correção (15b): nesses
dois sítios o portão espera 250 ms (`gateSoon`); se o estado mudar antes, o `onState` abre-o na mesma. Também na
v5.7 publicada (o `t-ads` assíncrono sobre a v5.7 dá as mesmas cinco falhas e mais uma), não é regressão desta
volta.

## 6. Limites

- Confirmação final só a ouvir, no computador e no telemóvel do Paulo.
- Se voltar a acontecer: tecla d (painel `?dev`), separador Log, exportar JSON, e enviar; o registo guarda cada
  estado, o mute e o fator de lado.

# Auditoria de UI e UX da sala liquid: ronda 1 (termos), proposta

2026-10-18. Base: secções 4.3 e 5 do relatório da ronda 0 (`ui-audit.md`). O site continua em inglês.
Comprimentos em caracteres, com espaços. A barra de cima do computador tem hoje 50 caracteres de
rótulos (Mixtapes, Gift a tune, Background, Art, Focus, Arcade, Immerse); com as recomendações passa
a 54, folga que cabe sem mudar o desenho. Nada disto está implementado: espera a escolha do Paulo.

## 1. Termos

| # | Termo atual (onde) | Problema | Alternativas (caracteres) | Recomendação |
|---|---|---|---|---|
| 1 | Gift a tune (botão e título; l02:60, l02:144) | é uma sugestão sujeita a escuta, não um presente | Suggest a tune (14); Send a tune (11); Recommend (9) | Suggest a tune |
| 1a | recommend music to the house (subtítulo e dica; l02:60, l02:145) | «the house» e «recommend» num painel que diz «gift» | we listen to every suggestion (29); a tune for the crates (20) | we listen to every suggestion |
| 1b | Hand it over (GitHub) (l02:150) | não diz o que acontece | Send via GitHub (15); Open on GitHub (14) | Send via GitHub |
| 1c | Copy the note (l02:151, e «Copied» ao copiar) | «note» é vago | Copy the suggestion (19); Copy the text (13) | Copy the suggestion |
| 1d | a present from NOME (cartão; build-liquid.py:114) | o mesmo equívoco do «gift»; hoje nenhuma faixa tem crédito | suggested by NOME (12); picked by NOME (9) | suggested by |
| 1e | texto do painel, nota de rodapé e nota enviada ao GitHub (l02:146, l02:153, l06:775-785) | repetem «gift», «present», «hand it over», «recommendation» | texto novo na secção 3 | texto novo |
| 2 | Immerse (rádio e ala da arte; l02:65, l02:21) e Full screen (sala de foco; l07:444) | dois nomes para o ecrã inteiro | Full screen (11) nos três; Fullscreen (10) | Full screen |
| 3 | Background (botão da rádio, tecla v; l02:61) | na sala de foco «Background» são sons (l07:599) e fundos (l07:610); no telemóvel, «background» é ouvir com o ecrã fechado (dica do Brave) | Visuals (7); Change visuals (14) | Visuals (a tecla v fica mnemónica) |
| 3a | Background sounds (sala de foco, gaveta; l07:599) | idem; «Ambient» já é um perfil de som e um género | Room sounds (11); Soundscape (10) | Room sounds |
| 3b | grupo de fundos com aria-label «Background» (l07:610) | idem (só leitores de ecrã) | Screen background (17) | Screen background |
| 4 | Skip (monitor; l02:103) | promete saltar e abre o Earn the skip (oito toques dentro de 3 BPM) | Earn a skip (11); Skip… (5, a reticência anuncia um passo a mais) | Earn a skip; no telemóvel o monitor tem 200 px e a fila de botões passa a duas linhas (medir ao implementar; se ficar mal, Skip…) |
| 5 | The sound (botão do cartão e título do painel; l02:86, l02:115) | na sala de foco «sound» é o perfil de som; o próprio painel chama-se «about this genre» | The genre (9); About the genre (15); This genre (10) | The genre (título «The Genre») |
| 6 | Scene (gaveta; l07:525), What kind of work? (entrada; l07:458), Work (experiência; l07:572) | três nomes para a mesma escolha | Kind of work (12) nos três; Task (4) | Kind of work (a pergunta da entrada fica) |
| 7 | the selector's pomodoro (l07:529) | gíria da casa | focus and break lengths (23) | focus and break lengths |
| 7a | the programme valve (l07:586) | idem | which genres play (17) | which genres play |
| 7b | the house noise desk (l07:599) | idem | mixed under the music (21) | mixed under the music |
| 7c | Calm set (botão; l07:592) | não diz o que faz (acende só os géneros calmos) | Calm genres only (16) | Calm genres only |
| 8 | tap to drop the needle (abertura; l02:8) e touch to drop the needle (agulha; l02:111) | dois verbos; no computador não se toca | drop the needle (15) nos dois; click or tap to begin (21) | drop the needle (o pulsar já mostra que se carrega) |
| 9 | Drop the Needle (jogo da arcada; l08:78) | o mesmo nome que a ação de arrancar a rádio; o jogo é adivinhar o género de um disco escondido | Guess the Genre (15); Name the Genre (14) | Guess the Genre (opcional) |
| 10 | demonstration ficha (ficha de demonstração; l02:43) | «ficha» é português | demonstration sheet (19) | demonstration sheet |
| 11 | ceded film loop (ala da arte; l06:238) | em inglês «ceded» quer dizer renunciado (território, direitos); decalque de «cedido» | film loop on loan (17); loaned film (11) | film loop on loan |
| 12 | room sheet (botão e subtítulo da ficha; l02:36, l02:42) | possível decalque de «folha de sala»; não verifiquei se é corrente nos museus britânicos | about the work (14); notes (5); manter | about the work |
| 13 | Live feed (topo do monitor; l02:92) | mostra o vídeo do disco que toca, não uma emissão ao vivo | Video (5); On the deck (11) | Video |
| 14 | Screen on / Screen off (telemóvel; l06:742-757) | «Screen on» lê-se como estado e é uma ação | Keep awake (10); Keep screen on (14) | Keep screen on / Let screen sleep (opcional) |
| 15 | Crop / Fit (monitor) | segue a convenção da casa (o rótulo mostra a ação seguinte, como Mute / Unmute): sem mudança | | manter |

## 2. Factos do painel The Sound (secção 4.3 da ronda 0)

Contagem (l05:1356, vem do e05; muda-se por uma transformação no build-liquid.py):
- antes: «56 records from this sound in tonight's crate.»
- depois: «56 records of this genre in the station's crates.»

Créditos no fim do painel (l02:126). Antes:

> HOME MUSIC LIQUID · the liquid room of the house: same 24-hour programme, morning 06-13, afternoon
> 13-20, night 20-06, same crates, no stage, no ceremony. [...] Liner notes compiled from Wikipedia,
> Discogs, AllMusic and the music press. The main room, with the selector and the rite of the 45, lives
> at the station's front door. Shortcuts: [→] next · [m] mute.

Depois:

> HOME MUSIC LIQUID · the liquid room of the house: its own 24-hour programme in seven blocks, from
> Dawn (06-08) to After Hours (02-06), drawn from the same crates as the main room, with no stage and no
> ceremony. The background is the sound itself: a liquid field breathing with the levels and the tempo
> of what is playing. Tracks stream via YouTube, every tune linked to YouTube and Spotify. Liner notes
> come from Discogs and Wikipedia. The main room, with the selector and the rite of the 45, lives at
> the station's front door. Shortcuts: [→] earn a skip · [m] mute · [f] full screen · [v] visuals ·
> [w] art wing.

Fundamentos: sete sub-blocos na secção 8 do build-liquid.py (l05:528-534); dos 726 textos com fonte,
719 citam o Discogs e 5 a Wikipédia (`ops/queue/blurb-sources.tsv`), nenhum o AllMusic; a seta abre o
Earn the skip (l05:1854); f, v e w estão no l05:1856-1857 e no l06:673. «[→] earn a skip» e
«[v] visuals» acompanham os termos 4 e 3; se o Paulo os recusar, ficam «[→] skip» e «[v] background».

Ligações repetidas: quando o painel estendido existe (`#gExt` visível), as duas ligações do topo
(Wikipedia e mapa do Ishkur) repetem as de «Go deeper». Proposta: esconder as do topo nesse caso, só por
CSS (`#genrePanel:has(#gExt:not([hidden])) .g-links{display:none}`), sem tocar no motor.

## 3. Texto novo do Suggest a tune (se o termo 1 for aceite)

- Painel: «Heard something that belongs in this room? Suggest it. The founders listen to every
  suggestion and check the facts; if it joins the crates, the card credits you while it plays. Single
  tunes or whole playlists, both welcome.»
- Nota de rodapé: «Send via GitHub opens a prefilled issue on the station's public GitHub page (a free
  account is needed). No account? Copy the suggestion and send it to the founders any way you like.»
- Nota enviada: título «Tune suggestion: ...»; corpo «Tune suggestion for Home Music [...] House
  protocol: the founders listen first and verify artist, title and liner facts; accepted tunes join
  the crates, credited to the sender.»

## 4. Onde se mexe

Só fontes da interface (l02, l06, l07, l08) e o CSS do l01, exceto dois textos que vivem no
`liquid/build-liquid.py` (motor): «suggested by» (termo 1d) e a contagem do painel. São trocas de texto,
sem lógica; com o diff revisto antes do commit. Cada termo implementado entra no `ops/tests/t-ui.js`
(o rótulo novo presente e o antigo ausente na página montada).

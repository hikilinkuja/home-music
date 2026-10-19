# Home Music: instruções para as sessões Claude Code

Rádio web pessoal do Paulo, publicada por GitHub Pages em
https://hikilinkuja.github.io/home-music/ a partir do ramo `main` deste repositório.
Este ficheiro é a memória do projeto: as sessões na nuvem não têm outra. O trabalho em
curso e a fila estão em `ops/HANDOFF.md`; o histórico das voltas em `ops/LOG.md`.

## Como falar com o Paulo

- Português europeu, com o Acordo Ortográfico de 1990 (ação, objetivo, atividade, receção),
  sem brasileirismos nem anglicismos evitáveis.
- Tratamento: «Paulo» ou «Doutor Paulo». Sem preâmbulos, elogios ou validação automática;
  se uma premissa, um cálculo ou uma conclusão dele estiver errada, dizê-lo com fundamento.
- Nunca usar travessão (U+2014) nem meia-risca (U+2013), em posição nenhuma: vírgula, ponto e
  vírgula, parênteses ou reestruturar a frase. Aspas angulares «». Em listas, só o hífen curto
  «-», nunca o marcador redondo (U+2022).
- Expandir cada sigla na primeira ocorrência de cada resposta, por exemplo «API (interface de
  programação de aplicações)».
- Registo formal e denso, prosa por defeito; distinguir facto, inferência e incerteza; quando
  não souber, dizê-lo. Nunca afirmar ter ouvido áudio.
- No fim de cada volta: relatório curto com o que entrou (contagens por género), o que falhou
  e porquê, as decisões tomadas e o que fica em fila.

## Regras do projeto (decididas pelo Paulo)

- Há duas salas. A antiga é `index.html` na raiz do repositório; a «liquid» é
  `liquid/index.html`. Só a liquid recebe funcionalidades novas; a antiga fica congelada.
  O catálogo partilhado `radio/e03-data.html` pode receber dados novos, que chegam às duas.
- Protocolo de importação (regra permanente): canal «Artista - Topic» do YouTube primeiro; se
  não houver, canal oficial do artista ou da editora; se não houver, outro upload que confirme
  artista e faixa no título. «A música tocar é o mais importante», mas nunca aceitar um vídeo
  que não seja a faixa pedida. Se a mesma faixa (mesma mistura) existir em edição curta e em
  versão original ou estendida, preferir a longa, até 21 minutos (decidido a 2026-10-17).
- A fila de importação executa-se por defeito, sem esperar nova ordem.
- Lo-fi hip hop só na sala de foco. Oldskool hardcore fica parado (sem esforço dedicado).
- Excluir de qualquer importação: sets e mixes acima de 21 minutos, álbuns inteiros, vídeos
  de compilação, conteúdo gerado por IA, spam, versões ao vivo, covers, e crossovers pop ou EDM
  de festival que choquem com o perfil underground da rádio (lista em
  `ops/queue/exclusions.tsv`; com `title` preenchido exclui só essa faixa). Declarar as
  exclusões no relatório. Faixas retiradas ficam em `ops/queue/hold-*.tsv` (linha literal do
  e03, para reposição exata).
- Curadoria: sons quintessenciais e underground de cada género, com o Discogs e sítios de
  seleção exigente como referência. Nunca inventar avaliações, datas ou factos nos textos.
- Texto de cada faixa (campo `b`, o que aparece no canto inferior esquerdo; decidido a
  2026-10-18): específico dessa faixa, em inglês, até cerca de 220 caracteres. Ângulos, por
  ordem de preferência: impacto na cena ou no mundo; como foi feita (sample, estúdio, máquinas,
  circunstâncias); curiosidades e o que a faixa influenciou. Só factos com fonte verificável
  (Discogs, Wikipédia, entrevistas, imprensa especializada); a fonte fica registada em
  `ops/queue/blurb-sources.tsv` (videoId, URL da fonte). Sem fonte para nada disso, o texto diz o
  que a edição documenta (editora, ano, formato, créditos, notas da capa), nunca uma história
  inventada nem adjetivos de enchimento. Regra para todas as faixas novas: os textos genéricos
  de importação («From the station's ... crates») são provisórios e cada volta de importação
  escreve os textos das faixas que acrescentou antes de fechar.
- Este repositório é público: nunca guardar tokens, chaves ou dados pessoais em ficheiros.

## Gastos e qualidade (decidido pelo Paulo a 2026-10-08)

- Trabalhar sozinho por omissão. Subagentes ou fluxos de agentes só com estimativa prévia
  (número de agentes, tokens, tempo) e autorização expressa do Paulo.
- Pedidos com muitos itens: propor rondas e executar uma de cada vez; o que for só proposta
  (desenho, opções) fica em texto até o Paulo escolher.
- Trabalho em massa por scripts (resolver, validar, montar, testar); o modelo supervisiona e lê
  resumos, nunca saídas inteiras.
- Ler o necessário, não o mínimo: trechos quando chegam, ficheiros inteiros quando é preciso
  compreender.
- A poupança nunca justifica publicar sem testar: cada funcionalidade nova traz o seu teste em
  `ops/tests/`, os testes correm antes de publicar e, no motor, o diff é revisto antes do commit.
- Uma sessão por ronda, com o `ops/HANDOFF.md` atualizado no fim. Nível de esforço (escolhido pelo
  Paulo em cada mensagem): max para o motor, high para o resto.
- «Motor» é o código que decide e toca a música: `liquid/build-liquid.py` (gera o l05), o l03
  (registo) e o l04 (visual da troca). Catálogo, galeria, botões e textos não são motor.

## Arquitetura

- Catálogo: `radio/e03-data.html` define `BLOCKS`, `GENRES` (nome, Wikipédia, nota por género),
  `TRACKS` e `MC_LINES`. Cada faixa ocupa duas linhas:
  `{ g:"dub_techno", a:"Artista", t:"Título", y:1996, v:"VIDEOID11ch", s:null, w:null, ad:"2026-10-04",`
  `  b:"Blurb curto e factual, em inglês (língua do site)." },`
  `v` é o videoId do YouTube; `ad` é a data de entrada (selo «fresh in the crates» durante 14
  dias); `op:1` marca abridores de transição (introduções longas).
- Géneros (20 chaves): reggae, dub, ska_rocksteady, lofi, ambient, ambient_techno, dub_techno,
  lofi_house, liquid, intelligent_dnb, atmospheric_jungle, breakbeat, uk_garage, house,
  hypnotic_techno, deep_house, ragga_jungle, oldskool_hardcore, dubstep, focus_zen.
  BPM de referência por género em `GBPM` (`radio/e05-engine.html`). Um género novo exige
  entrada em `GENRES` e em `GBPM`.
- Grelha da liquid (7 sub-blocos, definidos na secção 8 de `liquid/build-liquid.py`):
  06-08 dawn (ambient, ambient_techno; abre sempre em ambient com o «dawn override»);
  08-13 kingston (reggae, dub, ska_rocksteady); 13-15 groove (house, lofi_house);
  15-18 flight (liquid, atmospheric_jungle, intelligent_dnb); 18-20 skank (breakbeat,
  uk_garage); 20-02 pressure (ragga_jungle, uk_garage, oldskool_hardcore, dubstep);
  02-06 afterhours (hypnotic_techno, deep_house, dub_techno). Teste: `?block=nome`.
- Motor: permanência por género proporcional à caixa, rotação persistente
  (localStorage `hm_rot`), sorteio ponderado por faixas por estrear, ponte entre blocos.
- Troca de disco na liquid (v4.0, secção 10 do `build-liquid.py`): cada disco toca até ao fim;
  levantar da agulha, 2,0 s de silêncio, pousar da agulha, música 0,4 s depois. O kit dub do
  intervalo só soa depois de reggae, dub, ska_rocksteady e ragga_jungle (tabela `GAPKIT`; os
  outros kits, backspin, spinback, tapestop, riser, siren, airhorn, echothrow, esperam escolha
  do Paulo). Os efeitos da emissão calam-se com a rádio de lado (foco, arcada) ou em mute.
- Anúncios do YouTube e leitores parados (v5.1, secções 10 e 12 do `build-liquid.py`, teste
  `ops/tests/t-ads.js`): portão do som, cada leitor só sai do mudo com a sua música em PLAYING
  (estado 1; o único `unMute` do motor está na função `gate`, e o build verifica-o; o mesmo na sala
  de foco); o disco seguinte arma-se 120 s antes do fim (`PRE_LEAD`) no prato livre, que espera
  fora do ecrã, 1 por 1 píxel (CSS do l01, só no computador), e entra no monitor ao ir para o ar;
  vigia do carregamento: progresso é `getCurrentTime()` a mudar, 15 s parado recarrega uma vez, a
  segunda paragem troca de disco, sem prazo fixo; no computador, um salto deixa o disco atual a
  tocar até o seguinte estar pronto.
- Rádio de lado (v5.7, secção 14 do `build-liquid.py`, teste `ops/tests/t-side.js`): com a sala de foco, a arcada ou
  uma tape a tocar, os dois pratos da rádio ficam em mudo, não só com volume 0 (o YouTube pode repor um volume seu
  e tirar o mudo); o portão não abre de lado e volta a calar, o fim do esbatido cala os dois pratos, o relógio dos
  VU vigia a cada 500 ms; ao voltar, o portão abre o prato do ar no início do esbatido e reaplica o volume.
- Registo de emissão: `HMPLOG` (l03) guarda cada disco em localStorage `hm_plog` (2000 linhas),
  exportável em CSV e JSON no painel `?dev` (tecla d: separadores Next, Log, Banks, Engine);
  `hm_intro_log` guarda porque a introdução falhou, quando falha. Os dados nunca saem do browser.
- Sala de foco (`liquid/l07-focus.html`, v4.6, alternativa D escolhida pelo Paulo): entrada
  (intenção, cenas `SCENES`, Begin), sessão (anel do tempo, barra de controlos) e gaveta de
  ajustes; memória em localStorage `hm_focus` (versão 2). O leitor da sala sorteia primeiro um
  género aceso e depois a faixa. Fundos: os três da sala (dusk, ink, off) ou um campo da rádio,
  copiado do canvas `#vj`; escolher um campo da rádio na sala muda também o da rádio
  (`HMFIELD.next`, l04 intacto). Ronda 1 da avaliação científica (v4.9, decidida pelo Paulo a
  2026-10-18): seis cenas por tarefa, intervalo de um quinto do bloco, música a descer no último
  minuto e «+5 min», intervalo guiado (música calada, chuva baixa, convite a sair do ecrã, «onde
  paraste»), só minutos durante o foco, sino suave por omissão, respiração opcional (1 ou 3 min).
  Ronda 2a (v5.0): perfis de som `PROFS` (silence, nature, ambient, lofi, minimal, liquid, energy),
  um por cena por omissão, mudado pela pessoa e lembrado por cena; a pergunta da primeira visita
  («Do you usually work with music on?») escolhe o perfil de cada cena (`SCENES[].p`: def, music,
  quiet). Zona «why?»: separador na barra de cima e ligações `.fc-why[data-why]` junto de cada
  decisão, gerados de `liquid/focus-evidence.json` (provas com força, fontes, o que não se sabe e
  como contrariar; mitos; estudos retirados). Cada decisão nova da sala leva entrada nesse ficheiro;
  o `validate.py` falha se um `data-why` ou `why:` não tiver prova. Porta: «Continue where you
  stopped» (um toque, com a nota), passo mais pequeno (mostrado no primeiro bloco) e linha de
  recomeço à segunda-feira e no dia 1. Ronda 2b (v5.2): registo dos blocos completos em localStorage
  `hm_focus_log` (versão 1, tampa de 2000 blocos; o «+5 min» do intervalo soma ao mesmo bloco; só
  blocos completos contam), totais de hoje e da semana no topo da porta e a semana em barras na
  gaveta, sem sequências; aviso suave passadas 4 horas num dia (dispensável por um dia); plano
  «se... então» opcional na linha do passo mais pequeno; «Park a thought» durante o trabalho (tecla t,
  lista no intervalo, guardada em `hm_focus`); experiência pessoal na gaveta (uma cena, dois perfis,
  um período por bloco, ordem ABBA com a primeira letra sorteada, nota de 1 a 5 só nos blocos da
  experiência, «I got distracted», bloco com o som mudado fora da contagem, resultado só com quatro
  de cada: médias, diferença por par e intervalo de 95% pela t de Student, com os limites ditos;
  exportação CSV e JSON, apagar). Os dados nunca saem do browser. `window.HMFR` expõe o estado aos
  testes; não confundir com `HMFOCUS`, do motor.
- Fontes da liquid, pela ordem de montagem em `ops/tools/build.sh`: `liquid/l01-head.html`,
  `l02-body.html`, o catálogo `radio/e03-data.html`, `l03-plog.html` (tem de ficar antes do
  l05, que o chama), `l04-vj.html`, `l05-engine.html`, `l06-art.html`, `l07-focus.html`,
  `l08-arcade.html`, `l09-dev.html`. O motor `liquid/l05-engine.html` é GERADO por
  `liquid/build-liquid.py` a partir de `radio/e05-engine.html`: nunca editar o l05 à mão.
- Fontes da sala antiga: `radio/e01-head.html`, `e02-body.html`, `e04a/b/c-stage.html`,
  `e05-engine.html` (congeladas).
- Som do «dawn override»: `sfx/dawn-mc.mp3` ainda não existe; o módulo HMDAWN (l06) toca os
  efeitos e salta a voz até o Paulo enviar a gravação.
- Notas de análise (mapas do motor, da galeria, da sala de foco, diagnósticos, conceitos de
  comentários e de zoom): `ops/notes/2026-10-08/` (ler o README dessa pasta primeiro).
- Amostras dos sons da troca de disco, para o Paulo escolher kits:
  `node ops/tools/fx_previews.js PASTA` (não guardar as amostras no repositório).

## Montar, validar e publicar

1. `git pull --rebase origin main` (um fluxo automático, «the dance nearby», faz commits
   periódicos em `events/europe.json`).
2. Editar as fontes ou o catálogo; nunca editar à mão `index.html` nem `liquid/index.html`.
3. `bash ops/tools/build.sh` monta as duas salas e corre `ops/tools/validate.py`
   (sintaxe JavaScript, caracteres proibidos, videoIds, géneros). Não publicar com falhas.
   Se a mudança tocar no motor, na interface ou nas salas: `bash ops/tests/run.sh` (monta e
   corre os testes no Chromium com o YouTube simulado, cerca de 18 minutos; ver
   `ops/tests/README.md`). Com `FAIL`, não publicar.
4. Commit com mensagem curta em inglês, prefixada pela versão (próxima: v5.8), e
   `git push origin HEAD:main`. O GitHub Pages atualiza em um a dois minutos.
5. Confirmar o servido com um pedido a
   `https://hikilinkuja.github.io/home-music/liquid/index.html?cb=<tempo>`.
6. Registar a volta em `ops/LOG.md` e responder ao Paulo com o relatório.

## Rede necessária nas sessões na nuvem

O ambiente da nuvem tem de permitir: `www.youtube.com`, `youtube.com`, `i.ytimg.com`,
`music.ishkur.com`, `hikilinkuja.github.io`, além da lista por omissão (PyPI, GitHub).
Ferramentas Python: `pip install -q yt-dlp ytmusicapi` no início da sessão. Se o YouTube
bloquear os pedidos vindos da nuvem, parar e reportar ao Paulo; nunca inventar videoIds.

Limite verificado a 2026-10-17: vista da nuvem (IP de centro de dados), o YouTube esconde todo o
conteúdo licenciado. A pesquisa não mostra vídeos «Topic», o YouTube Music devolve zero canções
(também em `music.youtube.com`) e as páginas dos canais «Topic» vêm vazias. Por isso, da nuvem,
o resolvedor só encontra S3 e S2. Para obter «Topic»: correr `ops/tools/yt_resolve.py` numa
ligação doméstica (sessão local do Claude Code no computador do Paulo, ou o próprio Paulo), ou
confirmar com `yt_resolve.py --verify` videoIds achados num motor de pesquisa externo (o oEmbed
funciona da nuvem e recusa vídeos que não se podem incorporar).

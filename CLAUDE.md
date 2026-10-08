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
- `radio/index.html` é uma cópia antiga criada por engano: não usar, não publicar a partir dela.
- Protocolo de importação (regra permanente): canal «Artista - Topic» do YouTube primeiro; se
  não houver, canal oficial do artista ou da editora; se não houver, outro upload que confirme
  artista e faixa no título. «A música tocar é o mais importante», mas nunca aceitar um vídeo
  que não seja a faixa pedida.
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
- Este repositório é público: nunca guardar tokens, chaves ou dados pessoais em ficheiros.

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
- Registo de emissão: `HMPLOG` (l03) guarda cada disco em localStorage `hm_plog` (2000 linhas),
  exportável em CSV e JSON no painel `?dev` (tecla d: separadores Next, Log, Banks, Engine);
  `hm_intro_log` guarda porque a introdução falhou, quando falha. Os dados nunca saem do browser.
- Fontes da liquid, pela ordem de montagem em `ops/tools/build.sh`: `liquid/l01-head.html`,
  `l02-body.html`, o catálogo `radio/e03-data.html`, `l03-plog.html` (tem de ficar antes do
  l05, que o chama), `l04-vj.html`, `l05-engine.html`, `l06-art.html`, `l07-focus.html`,
  `l08-arcade.html`, `l09-dev.html`. O motor `liquid/l05-engine.html` é GERADO por
  `liquid/build-liquid.py` a partir de `radio/e05-engine.html`: nunca editar o l05 à mão.
- Fontes da sala antiga: `radio/e01-head.html`, `e02-body.html`, `e04a/b/c-stage.html`,
  `e05-engine.html` (congeladas).
- Som do «dawn override»: `sfx/dawn-mc.mp3` ainda não existe; o módulo HMDAWN (l06) toca os
  efeitos e salta a voz até o Paulo enviar a gravação.

## Montar, validar e publicar

1. `git pull --rebase origin main` (um fluxo automático, «the dance nearby», faz commits
   periódicos em `events/europe.json`).
2. Editar as fontes ou o catálogo; nunca editar à mão `index.html` nem `liquid/index.html`.
3. `bash ops/tools/build.sh` monta as duas salas e corre `ops/tools/validate.py`
   (sintaxe JavaScript, caracteres proibidos, videoIds, géneros). Não publicar com falhas.
4. Commit com mensagem curta em inglês, prefixada pela versão (próxima: v4.1), e
   `git push origin HEAD:main`. O GitHub Pages atualiza em um a dois minutos.
5. Confirmar o servido com um pedido a
   `https://hikilinkuja.github.io/home-music/liquid/index.html?cb=<tempo>`.
6. Registar a volta em `ops/LOG.md` e responder ao Paulo com o relatório.

## Rede necessária nas sessões na nuvem

O ambiente da nuvem tem de permitir: `www.youtube.com`, `youtube.com`, `i.ytimg.com`,
`music.ishkur.com`, `hikilinkuja.github.io`, além da lista por omissão (PyPI, GitHub).
Ferramentas Python: `pip install -q yt-dlp` no início da sessão. Se o YouTube bloquear os
pedidos vindos da nuvem, parar e reportar ao Paulo; nunca inventar videoIds.

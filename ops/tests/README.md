# Testes da sala liquid

Testes automáticos que correm no Chromium sem rede: a página montada (`liquid/index.html`) é
servida a partir do repositório, o YouTube é substituído por um leitor simulado e o archive.org,
o freesound, a Wikimedia e o museu de Chicago recebem ficheiros de substituição gerados na hora
(nada binário fica no repositório). Cada verificação imprime `PASS` ou `FAIL`; quem corre os
testes só precisa de ler essas linhas.

## Como correr

```
bash ops/tests/run.sh                  # monta o site e corre todos (cerca de 10 minutos)
bash ops/tests/run.sh art devlog       # só os indicados
NOBUILD=1 bash ops/tests/run.sh gate   # sem montar antes
```

Regra: antes de publicar mudanças no motor, na interface ou nas salas, correr os testes; com
`FAIL`, não publicar. Mudanças só no catálogo bastam-se com o `build.sh` (que valida).

Precisa de Node, do Playwright com Chromium (vêm instalados nas sessões na nuvem) e do ffmpeg
(para o filme de substituição; sem ele, o teste da galeria é saltado com `WARN`).

## O que cada teste verifica

| Teste | Verifica | Tempo |
|---|---|---|
| `t-art.js` | filme 1 inteiro e não tapado pela barra nem pela ficha (telemóvel de pé e deitado, computador); botões de regresso com debrum vermelho; pinça amplia a obra e não a página | 40 s |
| `t-gate.js` | com a sala de foco aberta ou em mute, nenhum efeito da emissão (agulha, crepitar, kits) e master a 0; os efeitos voltam ao fechar | 1,5 min |
| `t-rain.js` | chuva no máximo: ganho 1,8 com CORS; sem CORS, duas cópias a volume 1,0; fader a 0 cala | 40 s |
| `t-focus.js` | sala de foco: seis cenas por tarefa e Begin («Read» sem música), só minutos no foco, pausa ao toque no anel, último minuto («+5 min», música a descer), intervalo de um quinto do bloco (música calada, chuva baixa, «onde paraste», «+5 min»), sino suave e respiração desligada por omissão, gaveta (Esc fecha, música desliga), fundos da sala e da rádio, sorteio por género, memória e migração da memória da v4.6; ronda 2a (v5.0): pergunta da primeira visita e perfis de som por cena (porta e gaveta, e o som mudado com «My last» escolhida a sobreviver ao Begin), zona «why?» (separador, Esc, ligação que abre a prova certa, todas as ligações com prova), passo mais pequeno no primeiro bloco, «continuar onde parei» e datas de recomeço; ronda 2b (v5.2): registo dos blocos completos em `hm_focus_log` (totais do dia e da semana no topo da porta, «+5 min» no mesmo bloco, registo ilegível recomeça vazio, tampa de 2000), aviso das quatro horas (dispensado por um dia), totais escondidos, plano «se... então» (porta, sessão e memória), pensamentos estacionados (tecla t, lista no intervalo, retirar), experiência pessoal (ordem AB BA a partir da letra sorteada, som de cada letra, nota de 1 a 5, «I got distracted», bloco com o som mudado fora da contagem e repetido, sem resultado antes de quatro de cada, médias e intervalo de 95% pela t de Student, limites ditos, inacabados, CSV e JSON descarregados, parar, apagar com segundo toque); nada sobreposto nem fora do ecrã em 1440x900, 1024x768, 390x844 e 844x390, no trabalho e no intervalo, também com a nota, os pensamentos e o aviso (o relógio acelera-se por `window.HMFR`) | 3 min |
| `t-devlog.js` | painel `?dev` escondido antes do arranque; motivos de fim no registo (lift, skip, error); CSV coerente e ano desconhecido vazio; separador Banks com os 7 blocos | 1 min |
| `t-intro.js` | archive.org lento (5 s): a introdução toca com as linhas; com erro: a emissão arranca e o motivo fica em `hm_intro_log` | 30 s |
| `t-ritual.js` | cada disco toca até ao fim; levantar, 2,0 s (mais ou menos 0,05), pousar; música 0,25 a 1,0 s depois; kit dub só depois de reggae, dub, ska e ragga jungle (computador em kingston, telemóvel em flight) | 2 min |
| `t-ads.js` | anúncios e leitores parados (o YouTube simulado ganha `window.__ytRule`: anúncio em estado -1 com o tempo a avançar, leitor parado no zero, anúncio a meio do disco): nenhum leitor sai do mudo antes do estado 1 (rádio no computador e no telemóvel, sala de foco, respiração), também com mute a meio do anúncio; anúncio a meio do disco calado logo; o prato à espera fora do ecrã (1 por 1) e o do ar no monitor; o disco pré-carregado entra sem espera; o rito espera um anúncio de 50 s sem trocar de disco; o salto espera pelo disco seguinte e faz-se no prato do ar se o livre ficar bloqueado; leitor parado (também o primeiro disco) recarregado uma vez ~15 s depois e trocado na segunda paragem. Oito cenários ao mesmo tempo | 1,5 min |
| `t-ui.js` | auditoria de UI, rondas 0 a 2: o Session log tem estilo (ligações em teal, sem sublinhado, separadas, contraste AA sobre o painel, no computador e no telemóvel); no telemóvel, a ficha da obra aberta fica por cima da dica da ala da arte e deixa ver o nome do artista; termos escolhidos pelo Paulo: os antigos ausentes das fontes da interface, os novos presentes, rótulos visíveis certos (Skip… só no telemóvel), botões do monitor do telemóvel em duas filas no máximo, ligações do topo do painel do género escondidas com o painel estendido ; ronda 2 (cores): nenhuma cor literal fora do `:root`, das variáveis da consola e das exceções, variáveis usadas todas definidas, contraste dos casos corrigidos, «Kill the bass» aceso em verde, acento da madrugada em pergaminho | 60 s |

## Limites (o que estes testes não apanham)

- o comportamento real do leitor do YouTube e do iPhone: só se verifica a ouvir no aparelho;
- a qualidade do som: os testes medem tempos e níveis, não ouvem;
- o que ninguém previu: cada funcionalidade nova deve trazer o seu teste, na mesma ronda.

## Como acrescentar um teste

Criar `ops/tests/t-nome.js` com a biblioteca `lib/common.js` (`openLiquid` abre a sala e liga a
emissão; `run(segundos, ações)` deixa correr; `analyse(log)` mede as trocas de disco; `suite`
imprime `PASS`/`FAIL`), acrescentar o nome à lista `ALL` do `run.sh` e uma linha à tabela acima.

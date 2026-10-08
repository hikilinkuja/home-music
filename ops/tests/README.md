# Testes da sala liquid

Testes automáticos que correm no Chromium sem rede: a página montada (`liquid/index.html`) é
servida a partir do repositório, o YouTube é substituído por um leitor simulado e o archive.org,
o freesound, a Wikimedia e o museu de Chicago recebem ficheiros de substituição gerados na hora
(nada binário fica no repositório). Cada verificação imprime `PASS` ou `FAIL`; quem corre os
testes só precisa de ler essas linhas.

## Como correr

```
bash ops/tests/run.sh                  # monta o site e corre todos (cerca de 6 minutos)
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
| `t-devlog.js` | painel `?dev` escondido antes do arranque; motivos de fim no registo (lift, skip, error); CSV coerente e ano desconhecido vazio; separador Banks com os 7 blocos | 1 min |
| `t-intro.js` | archive.org lento (5 s): a introdução toca com as linhas; com erro: a emissão arranca e o motivo fica em `hm_intro_log` | 30 s |
| `t-ritual.js` | cada disco toca até ao fim; levantar, 2,0 s (mais ou menos 0,05), pousar; música 0,25 a 1,0 s depois; kit dub só depois de reggae, dub, ska e ragga jungle (computador em kingston, telemóvel em flight) | 2 min |

## Limites (o que estes testes não apanham)

- o comportamento real do leitor do YouTube e do iPhone: só se verifica a ouvir no aparelho;
- a qualidade do som: os testes medem tempos e níveis, não ouvem;
- o que ninguém previu: cada funcionalidade nova deve trazer o seu teste, na mesma ronda.

## Como acrescentar um teste

Criar `ops/tests/t-nome.js` com a biblioteca `lib/common.js` (`openLiquid` abre a sala e liga a
emissão; `run(segundos, ações)` deixa correr; `analyse(log)` mede as trocas de disco; `suite`
imprime `PASS`/`FAIL`), acrescentar o nome à lista `ALL` do `run.sh` e uma linha à tabela acima.

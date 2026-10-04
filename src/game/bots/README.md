# Estratégia dos bots

Os bots executam comandos normais da engine pelo host. A estratégia recebe somente o estado público e a própria mão. Não consulta o baralho nem as mãos dos rivais.

- `botEvaluation.ts`: estima cargos possíveis, ameaças e valor das cartas.
- `botStrategy.ts`: compara ações e alvos, decide bloqueios/contestações e escolhe apoios.
- `botController.ts`: agenda uma decisão por vez e cancela decisões ao mudar a fase.
- `createBots.ts`: cria participantes identificados como bots e prontos para jogar.

## Como decide

Cada ação válida recebe uma pontuação considerando benefício, custo em moedas, possibilidade de bloqueio e risco de perder um apoio ao blefar. O alvo faz parte da comparação. Eliminar o último rival vale mais que ganhar moedas; aproximar-se de uma ação que pode pagar também tem valor. Não há acesso privilegiado às cartas para calcular esses riscos.

O bot estima a disponibilidade de um cargo descontando a própria mão e os descartes. Alegações recentes aumentam a estimativa, mas não são tratadas como prova. Blefes desmascarados reduzem a confiança. Trocas, perdas e substituições de cartas invalidam as alegações anteriores daquele jogador. Essa memória é limitada aos eventos disponíveis no histórico público (atualmente 50).

Blefes só entram na comparação quando o cargo ainda é possível. Seu custo aumenta contra adversários que contestam frequentemente e quando o bot tem apenas um apoio. Diante de uma eliminação iminente, ele pode arriscar uma defesa falsa. Contestações comparam ganho provável e perda, incluindo a possibilidade de usar uma defesa verdadeira depois.

Nas trocas, compara todas as combinações possíveis de cartas a manter. O valor depende das moedas, ameaças e cargos adversários estimados; cartas duplicadas têm valor reduzido.

## Ajustes em `game.config.json`

O nível difícil acrescenta avaliação dos limiares de moedas (ataques e defesa do Intocável), extorsão para desarmar rivais, penalidade por financiar ataques adversários e prioridade absoluta a vitórias imediatas sem risco de bloqueio. Nas perdas e trocas, considera defesa contra Executores prováveis e a combinação Barão/Executor. Ao contestar, considera a perda adicional pelo ataque pendente; ao blefar, considera contradições com seus cargos alegados. Essas heurísticas ficam restritas ao difícil e não constituem busca completa nem garantem maior taxa de vitória em toda mesa.

- `bots.decisionDelaySeconds`: tempo máximo de espera. Cada decisão sorteia uma pausa entre 20% e 100% desse valor (5 segundos permitem pausas de 1 a 5 segundos). Se a fase estiver perto de vencer, a pausa é encurtada para no máximo 80% do tempo restante.
- `bots.bluffWillingness`: chance de considerar blefes (não é a frequência final de blefes). Uma defesa contra eliminação iminente pode ignorar esse limite.
- `bots.riskTolerance`: valores maiores reduzem a penalidade de arriscar um apoio; deve ser maior que zero.
- `bots.decisionVariation`: pequena variação de pontuação para evitar decisões idênticas em situações equivalentes.

É uma estratégia heurística adaptada ao estado atual, não um modelo treinado nem uma busca completa dos próximos turnos. As estimativas são aproximações e ainda podem ser calibradas com partidas reais.

## Calibração por simulação

Os perfis de `botDifficulty.ts` foram ajustados com partidas bot contra bot (3.000 por cenário, assentos e primeiro jogador alternados). Dois parâmetros controlam o blefe:

- `challengeBase`: chance base de um rival contestar uma alegação. Valores baixos fazem o bot achar que blefar é seguro.
- `bluffPenalty`: multiplicador da perda esperada ao ser pego blefando.

O blefe do bot otimista (`challengeBase` 0,12) perdia para jogadores mais cautelosos. No Pro, a base subiu para 0,55 e a penalidade para 3, então ele só blefa quando quase ninguém pode contestar. Planejamento alto (`planningWeight` 1) também prejudicava em duelos e foi reduzido.

Vitórias em mesa de 4 (fácil, intermediário, difícil, Pro): 7%, 21%, 32% e 40%. Em duelo, o Pro vence o Difícil em cerca de 62% e o Intermediário em cerca de 60%. Ao mexer nos pesos, repita a simulação: a diferença entre níveis é pequena e some com poucas partidas.

## Adaptação ao estilo de cada rival (Pro)

O Pro lê o histórico público de cada jogador e ajusta duas estimativas:

- `challengeEvidence` e `bluffScrutiny`: taxa observada de contestações (contestou ÷ chances), puxada para `challengeBase` até haver alegações suficientes. Quem quase nunca contesta reduz o risco do blefe, então o bot blefa mais perto dele. `bluffScrutiny` multiplica as contestações vistas, porque quem contesta costuma mirar os blefes.
- `honestyEvidence`: proporção de alegações que se sustentaram quando testadas (`PROVED_CARD_REPLACED` contra `BLUFF_EXPOSED`). Substitui o piso fixo de confiança e deixa o bot contestar mais quem blefa muito.

Com 0, o nível usa os valores fixos antigos. A memória vale só dentro da partida e depende dos 50 eventos recentes.

Simulação (4.000 partidas por cenário, assentos alternados), vitórias do Pro: 78% contra o Fácil, 60% contra o Intermediário e 58% contra o Difícil em duelo. Em mesa de 4 (Fácil, Intermediário, Difícil, Pro): 6%, 21%, 32% e 41%. Contra três Difíceis o Pro fica com 31% (o justo seria 25%) e contra três Intermediários, com 40%. Contra um bot que nunca contesta, chegou a 59% em duelo antes do último ajuste de pesos.

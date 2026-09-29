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

# Bastidores do Poder — arquitetura online com PeerJS

Este documento descreve a implementação atual e as regras aplicadas. Atualizado após a correção da auditoria de setembro de 2026. As regras de personagens e exemplos estão em src/constants/gameData.ts; as decisões da partida são executadas pela engine, nunca pela interface.

## 1. Arquitetura e arquivos

A rede usa topologia estrela: clientes PeerJS conectam-se somente ao navegador do host. Não existe backend da aplicação ou API REST de salas. O servidor de sinalização PeerJS estabelece as conexões WebRTC; não executa regras do jogo.

| Responsabilidade | Implementação |
| --- | --- |
| Regras, ações, desafios, perdas, vitória e timeout | src/game/engine/gameEngine.ts |
| Matriz de bloqueios, elegibilidade e ordem horária | src/game/engine/rules.ts |
| Baralho de 24 cartas, três de cada personagem | src/game/engine/deck.ts |
| Modelos de estado, comandos, validação e eventos | src/game/models/ |
| Autoridade, identidade, snapshots e agendamento | src/online/peer/peerHost.ts |
| Cliente, revisão recebida e heartbeat | src/online/peer/peerClient.ts |
| Envelope e validação das mensagens | src/online/peer/protocol.ts |
| Código da sala e credenciais em sessionStorage | src/online/room/ |
| Sessão reativa e tentativas de reconexão | src/stores/gameStore.ts |
| Interface online | src/components/online/ |

A engine não depende de Vue, PeerJS ou DOM. Ainda utiliza Date.now e Math.random para prazos, IDs de eventos e embaralhamento; portanto não é uma função estritamente determinística. Os testes controlam estados e relógios para verificar seus efeitos.

## 2. Sala e início

O código gera o peerId determinístico do host por roomCodeToPeerId. O link atual é /game/:id; /play/:id e /jogar/:id redirecionam para essa rota.

Ao criar sala, colisões de identificador recebem até cinco tentativas com novos códigos. Ao entrar, o jogador recebe uma identidade local e um token aleatório gerados com crypto.randomUUID. A conexão passa a ser vinculada à identidade somente após JOIN_ROOM aceito pelo host. Uma conexão não pode assumir outra identidade sem autenticação de reconexão.

São aceitos de dois a oito jogadores. Somente o host inicia. Todos devem estar conectados e prontos. Cada jogador recebe dois apoios secretos e C$2; o restante fica no baralho privado do host.

## 3. Estado público e privado

GameState contém fase, revisão, ordem da mesa, dinheiro, contagem de apoios, cartas perdidas, ação pendente, deadlineAt, histórico e vencedor. responsePlayerIds contém a fila pública de jogadores ainda elegíveis; apenas o primeiro pode responder.

AuthoritativeGameState mantém, exclusivamente no host, as mãos, o baralho, tokens, avisos privados e a continuação da perda de apoio por desafio. O snapshot público contém deckCount, nunca o baralho ou mãos secretas.

PRIVATE_VIEW é enviado apenas à conexão autenticada do jogador e contém seus apoios e o último resultado privado do Mandado, quando houver. Cartas perdidas e cartas comprovadas são informações públicas conforme o manual. O host, por executar o jogo, conhece todos os apoios; não há proteção contra um host malicioso nesta arquitetura.

## 4. Protocolo e validação

Os comandos de cliente usam Envelope com protocol=1, messageId, roomCode, playerId, sentAt e revision. JOIN_ROOM e RECONNECT dispensam revisão atual; comandos de jogo exigem correspondência exata com a revisão oficial.

O host valida:

1. Formato do envelope, comando, payload, personagens e identificadores.
2. Sala e identidade vinculada à conexão; a identidade do host só é usada localmente.
3. Token e prazo nas reconexões.
4. Duplicidade de messageId para comandos de uma identidade autenticada, com cache limitado aos últimos 1024 IDs.
5. Deadline e revisão atual.
6. Fase, jogador vivo, turno ou prioridade da resposta, saldo, alvo e regras específicas na engine.

Comandos aceitos recebem COMMAND_ACK. Rejeições recebem COMMAND_REJECTED, com motivo como STALE_STATE, INVALID_PHASE, NOT_ELIGIBLE_TO_REACT, INVALID_TARGET, UNAUTHORIZED ou ROOM_FULL. Um snapshot atualizado acompanha a rejeição por estado obsoleto. O cliente deve conferir a mesa e tentar novamente; não há reenvio automático de uma jogada obsoleta.

Mensagens operacionais: ROOM_SNAPSHOT, PRIVATE_VIEW, COMMAND_ACK, COMMAND_REJECTED e HEARTBEAT_ACK. O histórico de eventos está dentro do snapshot; não existe transmissão independente de todos os eventos enumerados na proposta original. Heartbeat é uma mensagem de transporte, sem poder alterar a partida.

## 5. Fluxo das ações e respostas

O turno começa em WAITING_ACTION. Custos são debitados na declaração e nunca devolvidos. Ações que alegam personagem abrem WAITING_CHALLENGE_ACTION. Depois da validação da ação, as bloqueáveis abrem WAITING_BLOCK. Uma defesa declarada abre WAITING_CHALLENGE_BLOCK.

As oportunidades seguem a ordem horária, começando pelo próximo adversário vivo de quem fez a alegação. Para bloqueios restritos ao alvo, apenas ele entra na fila, desde que tenha saldo para a defesa quando necessário. Cada jogador tem seu prazo; passar ou deixar expirar remove somente sua oportunidade. A fila esgotada encerra a janela.

O autor não pode contestar sua própria ação nem bloquear sua própria Vaquinha. O bloqueador não pode contestar ou aceitar o próprio bloqueio pela mesa. Quem passou não volta a responder à mesma alegação. Uma ação admite um desafio e uma tentativa de bloqueio; o bloqueio admite seu próprio desafio. Se a defesa for desmascarada, não se abre uma segunda defesa.

A UI usa as funções de elegibilidade da engine e exibe controles apenas para o respondente atual. Não exige possuir a carta: o blefe é permitido. Possuir uma defesa não gera proteção automática.

## 6. Matriz de ações

| Ação | Custo ou ganho | Desafio da ação | Bloqueio | Quem bloqueia |
| --- | --- | --- | --- | --- |
| Salário Oficial | +C$1 | Não | Nenhum | — |
| Vaquinha Virtual | +C$2 | Não | Barão | Adversário vivo, em ordem |
| Caixa 2 — Barão | +C$3 | Sim | Nenhum | — |
| Extorsão — Coronel | Toma até C$2 | Sim | Coronel ou Marqueteira | Alvo |
| Execução — Executor | C$3 | Sim | Advogada | Alvo |
| Troca — Marqueteira | Sem custo; compra duas e devolve duas | Sim | Nenhum | — |
| Mandado — Investigador | C$5 | Sim | Advogada ou Coronel | Alvo |
| Acordo — Articuladora | +C$2 para autor, +C$1 para beneficiário | Sim | Nenhum | — |
| Impeachment comum | C$7 | Não | Intocável, pagando C$3 | Alvo |
| Impeachment definitivo | C$10 | Não | Nenhum | — |

Com C$10 ou mais no início do turno, somente Impeachment definitivo é permitido. Isso também vale para o timeout. Ataques, Extorsão e Acordo exigem outro jogador vivo como alvo/beneficiário. O Mandado exige um personagem válido nomeado antes do pagamento.

## 7. Desafios, perdas e continuação

A engine consulta somente apoios ativos para comprovar a alegação.

- Alegação falsa de ação: autor perde um apoio e a ação é cancelada.
- Alegação verdadeira de ação: desafiante perde um apoio; se a partida continuar, a carta comprovada volta ao baralho, embaralha-se e compra-se uma reposição. Depois abre-se o bloqueio cabível, inclusive se o desafiante era o alvo e sobreviveu.
- Bloqueio verdadeiro: desafiante perde um apoio; a ação fica bloqueada.
- Bloqueio falso: bloqueador perde um apoio e o efeito original continua, sem nova janela de defesa. Um alvo com dois apoios pode perder ambos na mesma jogada.

WAITING_CARD_CHOICE distingue a perda por desafio da perda pelo efeito por uma continuação privada explícita. Com apenas um apoio, a perda é automática. Apoios perdidos permanecem revelados e não voltam ao baralho, não comprovam alegações e não podem ser devolvidos na troca.

Se o alvo for eliminado durante o desafio, o ataque/roubo termina sem outro alvo. Se o beneficiário do Acordo for eliminado, ninguém recebe dinheiro. Ao restar um vivo, FINISHED encerra imediatamente a partida, limpa deadline e ação pendente e não executa efeitos ou reposições restantes.

## 8. Mandado e troca

O Mandado verifica os apoios atuais após desafios e defesa. Encontrando o personagem nomeado, revela e perde uma única cópia. Sem correspondência, não perde apoio pelo Mandado. O público vê o resultado e a carta efetivamente perdida; nunca recebe a mão completa. O executor também recebe um aviso em sua PRIVATE_VIEW, preservado para reconexão.

A Marqueteira compra duas cartas somente após a alegação ser validada. WAITING_EXCHANGE_CHOICE exige devolver exatamente duas cartas ativas distintas. Quem possuía um apoio permanece com um apoio ao final. O baralho mantém 24 identidades únicas, contando mãos e cartas perdidas uma única vez.

## 9. Prazos e ações automáticas

O host agenda e decide o vencimento usando deadlineAt absoluto. Clientes apenas exibem a contagem. Valores em DEFAULT_GAME_SETTINGS:

| Situação | Prazo | Ação automática |
| --- | --- | --- |
| Decidir ação | 45 s | Salário; com C$10+, definitivo contra o próximo adversário vivo |
| Oportunidade de bloqueio | 12 s por jogador | Passa somente esse jogador |
| Oportunidade de desafio | 10 s por jogador | Passa somente esse jogador |
| Escolher perda | 20 s | Primeiro apoio ativo na ordem da mão |
| Escolher devolução | 20 s | Devolve as duas cartas recém-compradas |

Cada nova fase ou respondente recebe novo prazo, e o host reagenda também após ações automáticas. Timeout não é comando de rede; apenas o host chama executeTimeout. Jogadores ausentes continuam sujeitos a essas escolhas padrão.

## 10. Reconexão e queda do host

Cliente envia heartbeat a cada cinco segundos; silêncio acima de 15 segundos faz a conexão ser encerrada. O host reserva a identidade por 60 segundos após detectar a desconexão. RECONNECT deve comprovar playerId e reconnectToken. A conexão antiga perde autorização antes de ser fechada, impedindo que seu evento de fechamento desconecte a nova.

A store usa a sessão salva para reconectar e tenta novamente após quedas. Reabrir o link na mesma sessão também restaura o jogador dentro do prazo. O host devolve snapshot atual, deadline vigente e somente a visão privada do titular. O relógio da partida não pausa durante a reconexão.

Expirado o prazo, a reconexão é rejeitada. Durante a partida, o ausente permanece na mesa e recebe as ações automáticas. No lobby, o registro é removido após o prazo para não impedir o início pelos jogadores presentes. Não há substituição por outro jogador durante a partida. O prazo de graça e heartbeat são constantes da camada PeerJS, separados dos prazos de jogada.

Se o navegador do host fechar/recarregar ou seu estado em memória for perdido, a partida não pode ser recuperada pelos clientes. Eles informam a desconexão e a tentativa de retorno falha se o host não voltar. Não há eleição de novo host, backup de mãos ou persistência autoritativa.

## 11. Testes

- tests/unit/gameEngine.test.ts: comportamento básico e eliminação.
- tests/unit/onlineRulesRegression.test.ts: 80 combinações de ação/defesa, ordem de respostas, desafios verdadeiros/falsos, continuação do ataque, saldo, alvos, vitória imediata, troca e timeouts.
- tests/unit/peerHostRegression.test.ts: transporte simulado, identidade, sigilo, tokens, reconexão, mensagens obsoletas/duplicadas, heartbeat e reagendamento.
- tests/unit/onlineInterface.test.ts: botões de reação, saldo do Intocável, prioridade de resposta e prontidão do lobby.
- Demais testes unitários verificam o manual, componentes e stores.

Executar pnpm test, pnpm lint e pnpm build. Os testes de transporte usam conexões simuladas; conectividade WebRTC entre redes reais depende também de NAT, firewall e disponibilidade da sinalização.

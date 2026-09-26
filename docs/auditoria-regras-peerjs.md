# Auditoria de regras e arquitetura online

## Atualização após as correções

As falhas da engine e da camada online descritas na auditoria abaixo foram corrigidas. O texto original foi preservado como registro histórico, não como descrição dos problemas ainda presentes.

Correções entregues:

- Fila de resposta horária compartilhada entre engine e interface; passar afeta apenas a oportunidade do jogador atual.
- Continuação explícita após perda por desafio: defesa continua disponível depois de comprovar a ação; bloqueio falso permite o efeito original e uma segunda perda quando cabível.
- Exclusão do autor na defesa da Vaquinha, saldo de C$3 do Intocável e matriz centralizada.
- Vitória imediata, reposição somente após o desafio se a partida continuar, validação de beneficiário e palpite do Mandado, informação privada ao executor.
- Timeouts para todas as fases interativas, reagendamento contínuo e Impeachment definitivo automático quando obrigatório.
- Validação de payload, sala, identidade da conexão, revisão, duplicidade e autoridade do host; ACK/rejeição de comandos e envio autenticado das mãos.
- Reconexão por token dentro de 60 segundos, heartbeat, invalidação da conexão antiga, restauração de visão privada e fila/deadline.
- Limite de oito jogadores, início somente com todos conectados e prontos, remoção de ausentes do lobby após o prazo de graça e nova tentativa em colisão de código.
- Documento de arquitetura reescrito para refletir os arquivos, mensagens e políticas efetivamente implementados.

Validação final:

| Verificação | Resultado |
| --- | --- |
| Vitest completo | 151 testes aprovados em 8 arquivos |
| TypeScript/Vue, vue-tsc -b | Aprovado |
| ESLint completo | Aprovado |
| Build Vite/PWA | Aprovado |
| Playwright, tests/manual.spec.ts | 8 aprovados, 1 falhou |

A falha restante do Playwright está em tests/manual.spec.ts:49: após ativar o link de pular conteúdo, o elemento main não recebe foco. App.vue e src/utils/navigation.ts não foram editados nesta correção. A suíte de regras, transporte simulado e interface online passou integralmente.

Os cenários de rede foram testados com PeerJS simulado, incluindo identidade, tokens, mensagens concorrentes, snapshots, heartbeat e reconexão em desafio, bloqueio e troca. Não foi realizada uma partida WebRTC entre redes físicas distintas. O host continua sendo a autoridade confiável; perda de seu estado encerra a possibilidade de recuperação. Relógio e aleatoriedade ainda são locais ao host e não há replay estritamente determinístico; essa limitação foi explicitada no documento.

---

## Registro da auditoria inicial


Data: 25/09/2026 (America/Bahia). Escopo: árvore de trabalho local, incluindo alterações não commitadas. Nenhuma lógica de produção foi alterada nesta auditoria.

## Resultado

Conformidade parcial. A topologia PeerJS com host central, engine separada de Vue, snapshots públicos e envio individual de mãos existem. A matriz nominal de bloqueios corresponde ao manual em src/constants/gameData.ts, mas os fluxos de desafio, passagem de resposta, timers e autenticação não cumprem integralmente as regras.

## Falhas confirmadas

1. **Crítica — identidade e sigilo no host.** src/online/peer/peerHost.ts:89-92 e 117-141 aceitam playerId do envelope e sobrescrevem playerConnectionMap sem comprovar vínculo da conexão ou token. Uma conexão pode enviar PASS_RESPONSE em nome de outro cliente, inclusive fora de uma janela, receber resultado sem rejeição e fazer a visão privada desse cliente ser encaminhada à conexão invasora (178-197). Não foi realizado ataque em rede; conclusão por rastreamento completo do código. START_GAME também não valida que o remetente é o host na engine (gameEngine.ts:311).

2. **Alta — um jogador passa por toda a mesa.** gameEngine.ts:660-681 adiciona ao conjunto de passes, mas avança imediatamente sem consultar os demais elegíveis. Não verifica jogador vivo, prioridade ou impedimento de passar a própria alegação. GameBoard.vue:405-425 e 455-475 oferece Passar/Permitir também ao declarante e Aceitar Bloqueio também ao bloqueador. Um clique pode retirar a chance de contestação dos outros. Na Vaquinha, o passe de um adversário retira o direito dos demais bloquearem. Prioridade horária não é implementada em DECLARE_BLOCK/DECLARE_CHALLENGE.

3. **Alta — desafio verdadeiro pula a defesa.** gameEngine.ts:766-778 chama resolveApprovedAction após a perda de apoio por um terceiro que contestou. Executor comprovado passa diretamente à perda do alvo, sem abrir WAITING_BLOCK para Advogada. O mesmo caminho afeta Extorsão e Mandado. Reprodução: Ana declara Execução contra B; C contesta e perde uma carta; resultado WAITING_CARD_CHOICE para B, esperado WAITING_BLOCK.

4. **Alta — perda do desafio pelo alvo cancela indevidamente o efeito.** gameEngine.ts:770-775 interpreta qualquer perda do alvo como efeito já aplicado. Se B contesta o Executor verdadeiro, perde um apoio e sobrevive, a ação é encerrada sem dar continuidade ao ataque/bloqueio. Se B blefa Advogada ou Intocável e perde o desafio, a primeira perda encerra o ataque; deveria continuar e perder outro apoio, se ainda vivo. Ambos os caminhos foram reproduzidos; B permaneceu com um apoio e o turno terminou.

5. **Média — autor bloqueia sua própria Vaquinha.** gameEngine.ts:591-594 verifica somente o personagem Barão; GameBoard.vue:98 permite qualquer jogador vivo. A regra em gameData.ts:505 permite somente adversários vivos. Reprodução: autor declara Vaquinha e seu próprio bloqueio é aceito.

6. **Alta — timers incompletos.** peerHost.ts:226-240 não trata WAITING_CARD_CHOICE nem WAITING_EXCHANGE_CHOICE, podendo deixar a partida parada. No timeout de WAITING_ACTION, apenas finaliza o turno, inclusive com C$10+, permitindo evitar o Impeachment obrigatório. Depois desse avanço não chama schedulePhaseTimeout, deixando o próximo turno sem timeout agendado. Constatação estática.

7. **Média — Acordo sem validação de beneficiário.** gameEngine.ts:390-399 não inclui backroomDeal na validação; 950-964 paga ao autor antes de validar o parceiro. Aceita beneficiário ausente, inexistente, morto ou o próprio autor. Reprodução: acordo consigo mesmo elevou saldo de 7 a 10. A UI restringe a escolha, mas o host precisa validar o comando recebido. Também falta validar namedRole no Mandado antes de debitar seu custo.

8. **Média — botão do Intocável habilitado sem saldo.** GameBoard.vue:99 e 114-115 disponibiliza a defesa mesmo com menos de C$3. A engine corretamente rejeita o comando em gameEngine.ts:623-625. Trata-se de inconsistência da interface, não de defesa gratuita efetivada.

## Matriz verificada diretamente na engine

Foram exercitadas as 10 ações contra os 8 personagens de defesa (80 combinações), nas fases alcançadas pelo fluxo sem desafio. A aceitação nominal foi:

| Ação | Bloqueio permitido | Elegível |
| --- | --- | --- |
| Salário | Nenhum | — |
| Vaquinha | Barão | Deveria ser adversário vivo; código também aceita o autor |
| Caixa 2 | Nenhum | — |
| Extorsão | Coronel ou Marqueteira | Alvo |
| Execução | Advogada | Alvo |
| Troca | Nenhum | — |
| Mandado | Advogada ou Coronel | Alvo |
| Acordo | Nenhum | — |
| Impeachment comum | Intocável, pagando C$3 | Alvo |
| Impeachment definitivo | Nenhum | — |

Permitir alegar um personagem ausente da mão está correto: o manual permite blefe. Possuir uma defesa não deve bloquear automaticamente. Cartas perdidas não comprovam alegações: a engine consulta somente cartas com isLost=false.

## Diferenças do documento PeerJS

- O documento ainda se apresenta como proposta feita sem acesso ao repositório e mantém checklist vazio, embora engine, protocolo básico, lobby, rota e snapshots já existam.
- A seção 17 lista POST/PUT/GET/DELETE de salas, contradizendo a própria decisão sem backend. Esses endpoints não fazem parte da implementação observada.
- O Mandado aparece com bloqueio por Advogado apenas; manual e engine permitem Advogada ou Coronel.
- Os nomes Arrego e Queima divergem da implementação atual: Extorsão e Execução.
- Acordo e Troca não aparecem na tabela resumida de ações do documento.
- revision existe no estado e é incrementada, mas peerClient.ts:81-88 não a envia e peerHost.ts:89-92 descarta os metadados do envelope. Não há assertExpectedRevision, comparação de roomCode, deduplicação de messageId ou ACK de comando implementados.
- RECONNECT está no tipo, mas não tem tratamento na engine. reconnect.ts apenas persiste/lê credenciais; gameStore.ts sempre cria novas credenciais ao entrar. Não há restauração autenticada, prazo de graça nem heartbeat operacional.
- Colisão de ID da sala gera erro; não há geração automática de outro código e nova tentativa.
- O estado público real usa deckCount, não o baralho completo, o que é adequado ao sigilo. A separação física das mãos é correta, mas fica comprometida pelo vínculo de identidade não autenticado.
- O Mandado resolve perda e publica evento/descartes; não preenche searchResultNotice nem envia o resultado privado especificado. Revelar a carta efetivamente perdida é compatível com o manual e não equivale a vazar a mão inteira. O documento precisa distinguir informação pública de perda e informação privada adicional.
- A engine não importa Vue/PeerJS, mas usa Date.now e Math.random; não é estritamente determinística como descrito.
- O limite MAX_PLAYERS_PER_ROOM=8 está declarado, mas não é imposto no JOIN_ROOM; START_GAME não confere prontidão nem autoridade do remetente.

## Validação e limitações

Última execução: node node_modules/vitest/vitest.mjs run — 35 testes passaram em 5 arquivos. Na primeira execução houve falha por createInitialGameState inexistente; o arquivo foi alterado durante a auditoria por atividade externa a esta análise e a repetição passou. Os testes atuais não cobrem os fluxos defeituosos reproduzidos acima.

As reproduções usaram a engine TypeScript atual transpilada em memória e estados controlados de três jogadores. Os estados controlados de mãos serviram para isolar os fluxos; não foram usados para testar conservação do baralho. A matriz avaliou aceitação de bloqueios por personagem, sem afirmar que todas as continuações pós-desafio funcionam.

Não foram realizadas partidas entre navegadores nem testes reais de reconexão/WebRTC. Falhas do transporte e timers acima foram identificadas por leitura de código. Prioridade recomendada: autenticar conexão/identidade; corrigir janelas de respostas e continuação após desafios; completar timeouts; reforçar validação de comandos e reconexão; depois atualizar o documento para refletir a implementação validada.

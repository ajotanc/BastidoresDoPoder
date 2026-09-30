# Encerramento e revanche

O resumo público contém vencedor, código da mesa, turnos, duração, perda de apoio ou abandono decisivo, apoios restantes e Contos. O período entre o último salvamento e a retomada é descontado da duração. Salvamentos antigos sem início conhecido exibem duração não registrada.

O anfitrião pode preparar outra partida na mesma conexão, com os participantes ainda conectados, os bots, os perfis, a dificuldade e os tempos anteriores. As mãos, moedas e prontidão dos convidados são reiniciadas. O identificador da partida muda, mas o canal de conversa continua o mesmo. A mesa anterior permanece visível até iniciar a revanche; compartilhar a imagem antes preserva seu resultado.

A imagem PNG é gerada no navegador a partir do painel renderizado, preservando o avatar quadrado, as fontes e o layout do resumo. Os controles, o Accordion e os avisos de envio ficam fora da imagem. Quando o compartilhamento de arquivos não está disponível, o botão baixa a imagem. Sons de turno, contestação e vitória são opcionais, começam ativados e guardam somente a preferência local.

## Discord

A função `discord-result` publica um embed com o mesmo resumo sempre que há vencedor, independentemente do switch de conversa por voz ou do login Discord. Sair da mesa como anfitrião durante o jogo não gera anúncio de vitória. O destino fixo é `DISCORD_RESULTS_CHANNEL_ID`, disponível apenas às Functions. O canal precisa ser de texto e pertencer ao servidor configurado. Não há fallback para a sala de voz.

Esse endpoint recebe resultados públicos do anfitrião sem autenticação de usuário. Valida origem, formato, tamanho, horário de encerramento (até 24 horas), limita requisições por IP/domínio e impede menções. Não recebe destino arbitrário nem mãos privadas. Sem servidor autoritativo, não comprova a existência ou a integridade da partida: serve como histórico social, não como placar competitivo. A autenticação para **criar canais de voz** permanece obrigatória.

Falhas geram códigos sanitizados nos logs da Function: `RESULTS_CHANNEL_NOT_CONFIGURED`, `INVALID_RESULTS_CHANNEL`, `Discord HTTP 403` (acesso/permissões), `Discord HTTP 429` (limite do Discord) ou erro de leitura. Tokens nunca são registrados. Não há garantia de entrega se o anfitrião fechar a página antes da conclusão.

Permissões do bot no servidor e na categoria **Mesas do jogo**:

- Ver canais
- Gerenciar canais
- Criar convite instantâneo
- Conectar
- Ver o registro de auditoria (permissão do servidor)
- Enviar mensagens
- Inserir links (embeds)
- Ver histórico de mensagens

Não exige Administrador, Falar nem intents privilegiadas. O anúncio aparece no canal de texto de resultados. Nesse canal, o bot precisa de Ver canais, Enviar mensagens, Inserir links e Ver histórico de mensagens. O bot continua podendo aparecer offline: as Functions usam a API HTTP, sem manter uma conexão Gateway.

O host tenta publicar uma vez por partida. A função procura resultados anteriores do próprio bot (até 500 mensagens, parando ao alcançar mensagens anteriores à janela de 24 horas) e usa nonce determinístico com `enforce_nonce` para proteger tentativas simultâneas/recentes. Se a leitura exceder esse limite ou faltar permissão, não publica. Não há garantia de registro permanente: mensagens removidas não podem ser detectadas posteriormente, e o canal de voz continua sujeito à expiração de 24 horas. O canal fixo de resultados não é removido pela limpeza das salas de voz. Não é criado banco de partidas.

Falhas do Discord aparecem no resumo e não impedem compartilhar a imagem ou preparar a revanche. O teste automatizado usa respostas simuladas; a verificação real deve ocorrer após publicar as Functions e conceder as permissões.

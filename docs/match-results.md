# Encerramento e revanche

O resumo público contém vencedor, código da mesa, turnos, duração, perda de apoio ou abandono decisivo, apoios restantes e Contos. O período entre o último salvamento e a retomada é descontado da duração. Salvamentos antigos sem início conhecido exibem duração não registrada.

O anfitrião pode preparar outra partida na mesma conexão, com os participantes ainda conectados, os bots, os perfis, a dificuldade e os tempos anteriores. As mãos, moedas e prontidão dos convidados são reiniciadas. O identificador da partida muda, mas o canal de conversa continua o mesmo. A mesa anterior permanece visível até iniciar a revanche; compartilhar a imagem antes preserva seu resultado.

A imagem PNG é gerada no navegador. Quando o compartilhamento de arquivos não está disponível, o botão baixa a imagem. Sons de turno, contestação e vitória são opcionais, começam desativados e guardam somente a preferência local.

## Discord

A função `discord-result` publica um embed com o mesmo resumo, apenas quando existe vencedor e uma conversa habilitada. Sair da mesa como anfitrião durante o jogo não gera anúncio de vitória. O destino fixo é definido por `DISCORD_RESULTS_CHANNEL_ID` nas variáveis de ambiente das Functions, sem prefixo `VITE_`. Somente o anfitrião autenticado de uma mesa com conversa válida, verificada no registro de auditoria, pode publicar. O destino precisa ser um canal de texto do servidor configurado; sua ausência ou configuração inválida não provoca envio para a sala de voz. Nenhuma mão privada ou credencial entra no anúncio. O resultado é informado pelo anfitrião; não é um placar competitivo validado no servidor.

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

O host tenta publicar uma vez por partida. A função procura resultados anteriores do próprio bot (até 500 mensagens, parando ao alcançar mensagens anteriores à criação da mesa) e usa nonce determinístico com `enforce_nonce` para proteger tentativas simultâneas/recentes. Se a leitura exceder esse limite ou faltar permissão, não publica. Não há garantia de registro permanente: mensagens removidas não podem ser detectadas posteriormente, e o canal de voz continua sujeito à expiração de 24 horas. O canal fixo de resultados não é removido pela limpeza das salas de voz. Não é criado banco de partidas.

Falhas do Discord aparecem no resumo e não impedem compartilhar a imagem ou preparar a revanche. O teste automatizado usa respostas simuladas; a verificação real deve ocorrer após publicar as Functions e conceder as permissões.

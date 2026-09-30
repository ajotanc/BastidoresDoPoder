# Conversas de voz no Discord

## Configuração

Variáveis do Netlify disponíveis para Functions:
- DISCORD_BOT_TOKEN
- DISCORD_GUILD_ID
- DISCORD_CATEGORY_ID
- DISCORD_CLIENT_ID (ID do cliente na página OAuth2)
- DISCORD_CLIENT_SECRET (segredo OAuth2, nunca expor com prefixo VITE_)

Em OAuth2 > Redirecionamentos no Discord Developer Portal, cadastre:
- https://bastidoresdopoder.netlify.app/.netlify/functions/discord-auth
- http://localhost:8888/.netlify/functions/discord-auth para desenvolvimento com Netlify Dev, caso aceito na configuração do aplicativo. O cookie é Secure: use HTTPS local se o navegador não aceitar cookies Secure no localhost.
- Para outro domínio ou uma prévia, cadastre a URL exata correspondente antes de testar login.

O Vite sozinho não executa Functions. Use `netlify dev` para testar o fluxo completo. Nenhuma chave é embutida no frontend.

## Autorização e uso

O anfitrião clica em Conectar Discord e autoriza apenas o escopo identify em uma janela separada, preservando a aba da partida. Os convidados não precisam autorizar o aplicativo para ver o convite. O servidor exige uma sessão OAuth assinada, com cookie HttpOnly/Secure/SameSite=Lax, válida por oito horas. A criação fica vinculada ao ID Discord autenticado e ao UUID da sessão da mesa.

Isso autentica a conta responsável pela solicitação; não prova ao servidor que a mesa P2P existe ou que essa conta é seu anfitrião. Um usuário autenticado ainda pode chamar a API diretamente. Há limite de três solicitações por IP/domínio em 180 segundos e limite preventivo de 40 itens na categoria; limites globais por usuário e coordenação entre instâncias exigem armazenamento compartilhado.

## Canais e recuperação

Os canais novos usam Mesa (CODIGO). O identificador v2 no motivo de criação é estável e não depende do token. A auditoria só é aceita quando o autor corresponde ao próprio bot, permitindo trocar o token sem perder a identificação de canais novos. O bot precisa de Ver canais, Gerenciar canais, Criar convite, Conectar e Ver o registro de auditoria.

Uma varredura incompleta da auditoria causa falha controlada, em vez de presumir que o canal não existe. O anfitrião pode tentar novamente após o intervalo indicado pelo estado. Solicitações simultâneas na mesma instância são agrupadas; não há garantia de exclusividade entre diferentes instâncias, nem contra atraso na disponibilização do registro pelo Discord. Não são feitos retries automáticos de criação após resultados incertos.

Canal e convite expiram 24 horas após a criação, inclusive durante uma conversa em andamento. A interface deixa de oferecer convites expirados. O anfitrião pode solicitar uma nova conversa; convidados recebem o novo link pelo estado da mesa. Falhas no Discord não impedem jogar.

## Limpeza

A Scheduled Function roda a cada cinco minutos somente em produção e apaga até dois canais expirados por execução. Exige a categoria configurada, canal de voz e evidência de criação da integração. Canais sem evidência, movidos ou renomeados não são apagados. A auditoria é paginada, limitada a 12 segundos/1.000 entradas; ao atingir o limite sem concluir, a execução falha sem apagar canais. Em servidores muito movimentados será necessário um registro persistente com cursor.

Canais legados com assinatura no nome ainda são reconhecidos enquanto a assinatura puder ser validada. Canais antigos sem motivo de criação na auditoria podem exigir remoção manual após troca de token. Alterar o Client Secret invalida sessões OAuth existentes, exigindo novo login.

## Validação de produção

Após configurar OAuth e publicar: criar mesa, conectar Discord pelo anfitrião, conferir nome Mesa (CODIGO), entrada de voz com duas contas e compartilhamento do convite entre navegadores. Prévia não executa limpeza agendada. O bot aparece offline porque as Functions não mantêm conexão com o Gateway.

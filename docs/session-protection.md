# Proteção e recuperação da sessão online

O anfitrião salva automaticamente o estado completo em IndexedDB após mudanças: cartas privadas, baralho, decisões pendentes, configurações, respostas já recebidas, IDs de comandos processados e credenciais de reconexão. Nenhum desses dados privados é enviado no snapshot público.

Em `/game` ou ao reabrir o link da mesa, **Retomar partida** recupera a mesa no mesmo navegador, perfil e origem. Os saves usam um formato versionado; registros incompatíveis, corrompidos, encerrados ou expirados são removidos. A validade é configurada por `recovery.saveTtlHours` em `game.config.json` (24 horas desde o último checkpoint). Sair explicitamente ou descartar o save o exclui; fechar/recarregar a aba preserva o último checkpoint confirmado.

O código da mesa, as credenciais e a identidade da conversa Discord são preservados. Web Locks impedem duas abas da mesma origem de hospedar a mesma mesa. Se o PeerServer ainda estiver liberando o código anterior, aguarde e tente novamente; não é gerado outro código durante a recuperação. Uma falha ao retomar mantém o save.

A fase retoma com o tempo restante registrado no checkpoint. Havendo convidados humanos vivos, soma-se o prazo de reconexão (`reconnectGraceSeconds`); bots aguardam esse intervalo. Quem não retornar fica sujeito à regra de expiração de reconexão existente. Depois de esgotar tentativas automáticas, convidados podem usar **Tentar reconectar** quando o anfitrião voltar.

O salvamento usa transações sequenciais: uma escrita atrasada não recria uma partida já excluída. Falhas de armazenamento aparecem na interface. A última mudança ainda pode ser perdida se o processo encerrar antes da confirmação da transação. Dados removidos pelo navegador, navegação privada ou outro dispositivo não permitem recuperação. O salvamento não impede inspeção/alteração local pelo anfitrião.

A saída pelo jogo exige confirmação. Fechar/recarregar registra um aviso nativo, cuja exibição depende do navegador. Consultar o manual mantém a sessão aberta e oferece retorno à mesa.

O PWA não envia `SKIP_WAITING` nem recarrega abas: a nova versão aguarda todas as abas controladas fecharem. Na primeira implantação desta política, abas executando a versão antiga ainda podem seguir a política anterior.

Ainda exigem arquitetura adicional: manter a partida funcionando sem anfitrião, recuperação em outro dispositivo, migração de host e limites duráveis/exclusão mútua de canais Discord entre servidores.

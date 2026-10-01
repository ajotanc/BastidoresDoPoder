# Tipagem e dados externos

O projeto usa TypeScript com `strict` e `noImplicitAny`. A revisão não encontrou
anotações explícitas `any` no código da aplicação. Porém, APIs como `JSON.parse()`
e `Response.json()` retornam `any` pelas definições padrão do JavaScript/TypeScript.
Por isso, seus resultados devem entrar como `unknown` e ser validados.

- `any` permite acessar campos sem comprovar que existem; pode esconder erros.
- `unknown` representa um valor ainda não validado. Exige verificações antes do uso.
- Tipos do domínio representam dados já conhecidos, como `SavedSession` e
  `DiscordSession`. A sessão do Discord diferencia usuário e autorização OAuth.
- `Promise<void>` indica uma operação cuja conclusão importa, mas que não entrega
  dados ao chamador, como salvar ou excluir um checkpoint.

## Onde `unknown` continua correto

Mensagens recebidas de outros jogadores, dados do armazenamento, JSON de serviços
externos e erros capturados podem ter formatos inesperados. Não devem ser tratados
como objetos confiáveis usando apenas `as Tipo`.

`isRecord()` verifica se o valor é um objeto, excluindo `null` e arrays. Depois,
cada campo precisa de sua própria verificação. Uma assinatura válida de sessão
também não substitui a verificação do formato e da expiração.

Nos testes, `unknown` também aparece em transportes simulados e acessos controlados
ao estado interno. `expect.any(...)` é um comparador do Vitest, não a anotação
TypeScript `any`. Strings como `'unknown'` são casos de entrada inválida.

O TypeScript desaparece no build: as verificações em tempo de execução são o que
protege contra dados antigos, corrompidos ou inesperados no navegador e na rede.

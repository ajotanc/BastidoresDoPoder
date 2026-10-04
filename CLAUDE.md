# Bastidores do Poder

Vue 3 + TypeScript + Vite, gerenciador de pacotes **pnpm** (`pnpm install --frozen-lockfile`; npm falha com ERESOLVE).

## Rotas

- `/` e `/rules`: manual de regras
- `/game`: lobby online
- `/room/:id`: mesa de jogo

Sem redirects de rotas antigas. Ao mudar rotas, atualizar também `src/App.vue`, `LobbyRoom.vue`, `GameBoard.vue`, `netlify/functions/discord-result.ts`, os testes e `BDP.md`.

## Skills de uso obrigatório neste projeto

- **frontend-design** (`frontend-design:frontend-design`): em qualquer UI nova ou mudança visual.
- **superpowers**: `brainstorming` antes de features novas; `test-driven-development` ao implementar feature ou bugfix; `systematic-debugging` em bugs e testes falhando; `verification-before-completion` antes de dizer que algo está pronto.
- **caveman** (`caveman:caveman`): respostas curtas, resposta ou código primeiro, sem enrolação. Para localizar código, editar 1-2 arquivos ou revisar diff, preferir os agentes `cavecrew-investigator`, `cavecrew-builder` e `cavecrew-reviewer`.
- **vue-best-practices** (`vue-best-practices:vue-best-practices`): em qualquer trabalho com `.vue`, Vue Router, Pinia ou Vite. Composition API com `<script setup>` e TypeScript.
- **ui-ux-pro-max** (`ui-ux-pro-max:ui-ux-pro-max`): ao projetar, construir ou revisar interface, acessibilidade, interação, layout responsivo, tipografia e cor. Complementos: `ui-ux-pro-max:ui-styling` para Tailwind/Radix e `ui-ux-pro-max:design-system` para tokens e especificação de componentes. As demais (`banner-design`, `brand`, `design`, `slides`) só se o pedido for esse material.
- **humanizer** (`humanizer:humanizer`): ao escrever ou revisar textos em português da interface, do manual e da documentação, para não soarem gerados por IA.
- **code-simplifier** (agente `code-simplifier:code-simplifier`): para simplificar código recém-alterado sem mudar o comportamento. Também há `simplify` e `code-review` para revisar o diff.

## Componentes

Antes de escrever HTML puro (`<button>`, `<input>`, spinner, alerta, etc.), conferir `src/components/ui` e usar o componente existente. `AppButton` tem as variants `gold`, `primary`, `outline`, `secondary`, `ghost`, `transparent` e `danger`, e o size `icon` para botões quadrados só com ícone; outros ajustes vão por `class` (o `cn` resolve conflitos). Campos de texto e número usam `AppInput` (mesmo visual do `AppSelect`), alertas usam `Alert` (padrão pequeno) e o carregamento usa `Spinner`. Nomes de jogador ficam em `PlayerName`, que mostra o ícone de robô para bots. Só criar markup novo se não houver componente equivalente.

## Verificação

```bash
npx vue-tsc --noEmit
npx vitest run
```

# Bastidores do Poder

Manual interativo do protótipo para 3 a 8 jogadores, com oito personagens, 24 cartas de apoio e guia separado.

## Desenvolvimento

Use Node.js 24 e pnpm 11.19.0 (versão declarada em `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Validação

```sh
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

`pnpm check` executa lint, build com TypeScript e testes de navegador. O workflow em `.github/workflows/quality.yml` executa essa sequência em pushes na main e pull requests.

Os testes cobrem foco dos modais, giro por teclado, transição entre modais, busca sem acentos, links para seções, instalação recusada e larguras de 320, 360, 375 e 1280 px.

## Organização

- `src/constants/gameData.ts`: regras, personagens, exemplos e contagens.
- `src/constants/themeColors.ts`: paleta compartilhada com Tailwind.
- `src/components/ui`: componentes reutilizáveis e diálogo Radix acessível.
- `src/components/game`: seções do manual.
- `src/composables`: estado de visualizadores, navegação ativa e instalação.
- `public/images/previews`: versões WebP leves para visualização.
- `public/images/cards`: PNGs originais para download.

Ao atualizar uma arte, atualize também a miniatura WebP correspondente (até 640 × 960 px). O campo `previewSrc` identifica a miniatura e `imageSrc` continua apontando para o original.

## PWA e publicação

O service worker guarda o manual e as imagens de visualização para consulta offline após sua instalação completa. Os PNGs originais são baixados sob demanda; somente os já baixados ficam disponíveis offline. Fontes externas podem usar o fallback do sistema offline.

Imagens em URLs fixas são revalidadas pelo navegador. Não aplique cache HTTP `immutable` sem versionar as URLs dos arquivos.

O Netlify publica `dist` usando `pnpm run build`. A versão exibida no rodapé vem de `package.json`. Este projeto é um manual, não um motor de partidas digitais.

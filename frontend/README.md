# Frontend boilerplate

AI Coding Agentが今後のReact実装を判断するときのreference implementationです。

## Standard stack

- React + Vite + TypeScript
- React Router 8 Data Mode
- shadcn/ui (`base-nova`, Base UI)
- Tailwind CSS v4
- Storybook
- ESLint + eslint-plugin-jsdoc
- Prettier + Tailwind class sorting
- Vitest + Testing Library
- Playwright

## Run

repository rootから:

```bash
npm ci
npm run dev
```

Frontend単体では:

```bash
npm run dev --workspace @dev-standard/frontend
```

Storybook:

```bash
npm run storybook
```

VS Codeでは `.vscode/launch.json` から次をF5起動できます。

- `Frontend: Debug App in Chrome`
- `Frontend: Debug Storybook in Chrome`

## Structure

```text
frontend/
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── components.json
├── AGENTS.md
├── SKILLS.md
├── e2e/
│   ├── local-runtime.spec.ts
│   ├── smoke.spec.ts
│   └── support/
│       └── local-runtime.ts
├── src/
│   ├── api/
│   │   ├── httpClient.ts
│   │   └── httpClient.test.ts
│   ├── app/
│   │   ├── App.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── router.ts
│   │   ├── router.test.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── ui/                 # shadcnが生成するrepo-owned primitive
│   │   │   ├── button.tsx
│   │   │   ├── button.test.tsx
│   │   │   ├── button.stories.tsx
│   │   │   └── ...
│   │   └── common/             # application shared component
│   │       └── StatusCard.tsx
│   ├── features/
│   ├── lib/
│   │   └── utils.ts
│   ├── styles/
│   │   └── global.css
│   └── test/
│       └── setup.ts
├── eslint.config.js
├── playwright.config.ts
├── prettier.config.mjs
├── vitest.config.ts
└── vite.config.ts
```

## Routing architecture

既存ViteアプリへReact Routerの **Data Mode** を組み込んでいます。

- `src/app/routes.tsx`: route tableのsource of truth
- `src/app/router.ts`: `createBrowserRouter()` をReact tree外で1回だけ生成
- `src/app/App.tsx`: routed application shell。`Outlet`を描画
- `src/main.tsx`: `RouterProvider`をcomposition rootへ接続
- feature固有のroute UI: 原則 `src/features/` に置く

starterでは `/` とnot-found routeだけを持ちます。ダミー画面を増やすのではなく、実際のfeature追加時にrouteを増やします。

production hostingでは `/feature/123` のようなdeep linkを直接開いてもSPA entrypointへ到達できるfallback設定が必要です。Cloudflare側の具体設定はInfrastructure phaseで定義します。

## UI architecture

Design Systemは特定の `design-system/` directoryではなく、次の組み合わせとして扱います。

- `components.json`: shadcnのstyle/base/alias設定
- `src/styles/global.css`: semantic design token
- `src/components/ui/`: shadcnから追加したUI primitiveのsource code
- `src/components/common/`: primitiveを組み合わせたapplication shared UI
- Storybook: componentをapplicationから切り離して表示・確認するworkshop
- accessibility / test / formatter / lint rules

shadcn componentは外部packageとして隠蔽せず、source codeをrepository内で所有します。

## Add a UI component

まずshadcnに既存componentがあるか確認し、必要なものだけ追加します。

```bash
cd frontend
npx shadcn@latest add select
```

全部を先回りして追加しません。利用しないcomponentをstarterへ積み上げると、AIも人間も「存在するから使うべき」と誤解しやすくなるためです。

このstarterには基本例として `button`, `input`, `label`, `card`, `badge`, `alert`, `dialog`, `separator`, `skeleton`, `tooltip` を配置しています。

## Storybook boundary

- `*.stories.tsx` がStorybookで表示するcomponent/stateを定義します。
- shadcnから追加したcomponentすべてにStoryを強制しません。
- project固有にcustomizeしたUIや重要な共有componentは、重要variant/stateのStoryを追加・更新します。
- `button.stories.tsx` と `StatusCard.stories.tsx` がreferenceです。

## JSDoc Harness

公開境界はH068 `public-api-jsdoc` で機械的に検証します。

JSDoc必須:

- exported function / React component / hook / class
- exported type / interface / enum

必須対象外:

- private helper / inline callback
- test / story / E2E
- `src/components/ui/` のshadcn生成source

`components/ui` はCLI生成物を上流へ追従しやすく保つため、変更済みかどうかをESLintで推測しません。project固有の契約を持つUIは原則 `components/common` / `features` に置き、そこでJSDocを必須化します。

TypeScript型をJSDocへ重複記述せず、契約・制約・副作用・例外・役割を記述します。`npm run lint` がJSDoc不足や空blockをerrorにするため、Harness Verify / CIでも同じ規則が強制されます。

## Quality commands

通常の完全検証はrepository rootから次を実行します。

```bash
npm run harness:verify
```

Harness Verifyはformat / typecheck / lint / unit test / production build / Storybook build / browser E2Eを実行し、GitHub Actionsも同じHarnessを呼びます。

Playwrightは `vite preview` ではなく、`backend/` の `wrangler dev`（Workers + Assets）を起動します。build済みのSPAと `/api/*`（Hono + local D1）が同じoriginで動き、起動前にE2E専用のlocal D1（`backend/.wrangler/e2e-state`）へmigrationを適用します。そのため `npm run test:e2e:run` の前に frontend のbuildが必要です。

E2Eだけを単独実行する `npm run test:e2e` はproduction buildを先に行います。Harness/CIは既にproduction build済みなので、内部用 `test:e2e:run` を使って二重buildを避けます。

Backendが追加されるまでは実APIへ接続しません。契約確定後に `src/api/` から接続します。

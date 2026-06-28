# Aurora Capital

Aurora Capital is an autonomous investment and decision platform built with React + TypeScript + Vite. The project combines multi-agent analysis, market intelligence, configurable execution rules, and a trading interface inspired by modern charting terminals.

## Current Scope

- Multi-tab operational UI (intelligence, trading, history, settings).
- Agent-based decision flow with configurable roles and guardrails.
- API and LLM provider configuration from in-app settings.
- Trading chart powered by Lightweight Charts (TradingView open-source chart engine).
- Multi-environment behavior (Sandbox, Demo, Paper Live).
- Desktop packaging pipeline via Electron.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS + Radix UI
- Lightweight Charts
- Electron + electron-builder

## Integrations

- CoinMarketPro (market quotes via proxy endpoints)
- Binance (market/live context)
- Alpaca Paper (paper trading sync/testing)
- Configurable LLM providers in settings (provider and model assignment)

## Project Structure

- src/App.tsx: main app orchestration, tab routing, mode controls.
- src/components: UI modules (trading, decision center, settings sections, charts).
- src/lib: domain types, market intelligence, mock/seed logic, services.
- electron: desktop runtime entry points.
- docs/*.md: architecture and implementation notes.

## Local Development

Requirements:

- Node.js 20+
- npm 10+

Install:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build web app:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Build desktop executable artifacts:

```bash
npm run dist:win
```

## NPM Scripts

- npm run dev: start Vite dev server.
- npm run build: TypeScript build + Vite production build.
- npm run preview: preview dist build.
- npm run lint: run ESLint.
- npm run build:desktop: build web + package Electron.
- npm run dist:win: create Windows installer artifacts (NSIS).

## Configuration Notes

- Runtime and provider settings are managed from the app settings pages.
- API and LLM cards are dynamic (add/remove providers from UI).
- Agent model assignment is constrained to configured/visible providers.

## Trading UI Notes

- The chart module currently uses Lightweight Charts for legal and technical portability.
- A future migration to TradingView Charting Library/Trading Platform requires approved private repository access and license compliance.

## Security and Risk Controls

- Execution can be blocked by rule-engine conditions and safety guardrails.
- Environment switching is constrained by explicit enablement and safe defaults.
- Paper-first behavior is prioritized over real execution.

## Important Documents

- PRD.md
- SECURITY.md
- MULTI_ENVIRONMENT_SYSTEM.md
- ENHANCED_CONSENSUS_LEARNING.md
- IMPLEMENTATION_STATUS.md

## Status

The system is active and buildable. Ongoing work is focused on reducing UI/UX gaps vs advanced trading terminals and extending end-to-end functional workflows in trading and agent operations.

## License

See LICENSE for repository licensing terms.

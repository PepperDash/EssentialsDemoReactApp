# Essentials Demo React App

Mobile Control React app for the PepperDash Essentials v3 demo system.

## Overview

This is one of three repos that make up the Essentials v3 demo:

| Repo | Contains |
| --- | --- |
| [EssentialsDemoReactApp](https://github.com/PepperDash/EssentialsDemoReactApp) | This repo — the UI |
| [EssentialsDemoRoom](https://github.com/PepperDash/EssentialsDemoRoom) | The Essentials room plugin holding the demo's business logic |
| [EssentialsDemoConfig](https://github.com/PepperDash/EssentialsDemoConfig) | The configuration file and the deploy definition that bundles everything into one `.cpz` |

The app is a plain Vite + React + TypeScript project built on
[`@pepperdash/mobile-control-react-app-core`](https://www.npmjs.com/package/@pepperdash/mobile-control-react-app-core).
That library handles the connection to the processor — reading the app config, opening the Mobile
Control websocket, joining a room, and keeping room and device state in a Redux store — and exposes
it through hooks. This repo supplies the screens.

## How it fits together

```
index.html + main.tsx   Derive the router basename from the session URL Mobile Control serves
      |                 the app under (/mc/app/<token>/<roomKey>/).
      v
src/App.tsx             MobileControlProvider — the connection and state store. All UI renders
      |                 inside it.
      v
src/components/RoomBusiness/RoomBusiness.tsx
                        The room's routes, behind a boot-time sync gate.
```

Supporting pieces:

- **`src/hooks/useInitialDeviceSync.ts`** — walks the room config for every device key it mentions
  and asks for all of their state in one `/system/batchDeviceFullStatus` request, rather than one
  request per component.
- **`src/hooks/useHasCompletedInitialSync.ts`** — latches true once the processor answers that
  request, so the app paints once with populated state instead of flickering through empty values.
- **`src/types/DemoRoomState.ts`** — the shape of the room state the plugin pushes. It mirrors
  `DemoRoomStateMessage` in the room plugin; adding a field means changing both sides.

The screens themselves are still scaffolding — `RoomBusiness` currently has a single placeholder
route.

## Development

```bash
npm install
npm run dev
```

`npm run dev` serves the app at `/mc/app/` against a live processor. Point it at one by copying the
default local config and editing `apiPath`:

```bash
cp public/_local-config/_config.default.json public/_local-config/_config.local.json
```

`_config.local.json` is gitignored, so your processor address stays out of the repo.

Other scripts:

- `npm run build` — type-check and build to `dist/`
- `npm run lint`
- `npm run preview` — serve the production build locally

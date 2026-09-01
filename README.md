# BoilerPlate

A full-stack starting point: an Express + TypeScript backend and an Expo (React Native) mobile client, both pre-configured with production-grade conventions so new projects don't start from zero.

## Stack

- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose)
- **Mobile:** Expo (React Native)
- **Logging:** Pino (structured, leveled, with caller tracing in dev)
- **Validation:** Zod
- **File storage:** Local disk (swappable for S3 later via `utils/storage.ts`)

## Folder structure

```
BoilerPlate/
├── server/
│   ├── src/
│   │   ├── api.ts              # Entry point — wires everything together
│   │   ├── config/             # Startup config: env validation, DB connection, constants
│   │   ├── controllers/        # Route logic (what happens on a request)
│   │   ├── middleware/         # Auth, upload handling, error handling, 404s
│   │   ├── models/             # Mongoose schemas (empty — add as needed)
│   │   ├── routes/             # URL → controller mapping
│   │   └── utils/              # Logger, storage abstraction, shared helpers
│   └── uploads/                # Local file storage (gitignored except .gitkeep)
└── client/                     # Expo/React Native app
```

## First-time setup

**Server:**
```bash
cd server
npm install
```

Create `server/.env`:
```
MongoDB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/<db-name>?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

**Client:**
```bash
cd client
npm install
```

## Running things

| Command (run inside `server/`) | What it does |
|---|---|
| `npm run dev` | Development server, auto-restarts on save, verbose debug logs |
| `npm run build` | Type-checks and compiles TypeScript → `dist/` |
| `npm run start` | Runs the compiled build (`NODE_ENV=production`) — use this in production |
| `npm run lint` | Checks code for issues |
| `npm run format` | Auto-formats code with Prettier |

| Command (run inside `client/`) | What it does |
|---|---|
| `npx expo start` | Starts the dev server; scan the QR code with Expo Go |
| `npx expo start --tunnel` | Same, but routes through Expo's servers — use this if the QR code won't connect (common on WSL2/hotspots) |

## API reference (all routes prefixed with `/api`)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check, returns `{ status: 'ok' }` |
| POST | `/files` | Upload a single file (field name: `file`) |
| POST | `/files/batch` | Upload multiple files (field name: `files`, max defined in `constants.ts`) |
| DELETE | `/files/:filename` | Soft-deletes a file (moves to `uploads/deleted/`) |
| POST | `/files/:filename/restore` | Restores a soft-deleted file |

## Conventions used throughout this codebase

- **ES Modules, not CommonJS** — `import`/`export`, not `require`. Relative imports end in `.js` even though the source files are `.ts` (required by the `NodeNext` module setting in `tsconfig.json`).
- **Every function logs its own lifecycle:**
  - `logger.debug('functionName called')` at the top (dev-only, silent in production)
  - `logger.info(...)` right before a successful response
  - `logger.warn(...)` for bad/invalid requests (client's fault)
  - `logger.error(...)` for genuine failures (server's fault)
- **Constants belong in `config/constants.ts`**, not hardcoded inline — anything that's a fixed number, limit, or list of allowed values.
- **The storage layer (`utils/storage.ts`) is an abstraction** — controllers call `saveFile()`/`deleteFile()`/`restoreFile()`/`getFileUrl()` without knowing whether it's local disk or (later) S3 underneath. Swap the implementation in one file, nothing else changes.
- **Deletes are soft deletes** — files move to `uploads/deleted/` rather than being destroyed, and can be restored.
- **CommonJS packages with broken TS types** (e.g., `pino-http`, `pino-caller`) are imported via `createRequire`, not standard `import`, to avoid type errors on `npm run build`.

## Known issues

- On WSL, Expo's React Native DevTools (`@react-native/debugger-shell`) fails to launch due to missing Chromium shared libraries (`libnspr4.so` and others). Doesn't block running the app — only the optional in-app JS debugger.
  Fix:
  ```bash
  sudo apt install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0
  ```

## Extending this boilerplate for a new project

1. Rename the Atlas database in `server/.env`
2. Update `client/app.json`'s `name`/`slug` if renaming the app
3. Add Mongoose models in `server/src/models/`
4. Add matching controllers/routes following the existing pattern (see `file.controller.ts` / `file.routes.ts` as a template)

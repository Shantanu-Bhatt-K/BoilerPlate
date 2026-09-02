# BoilerPlate

A full-stack starting point: an Express + TypeScript backend and an Expo (React Native) mobile client, both pre-configured with production-grade conventions so new projects don't start from zero.

## Stack

- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose)
- **Mobile:** Expo (React Native)
- **Logging:** Pino (structured, leveled, with caller tracing in dev)
- **Validation:** Zod
- **File storage:** Swappable driver — local disk or S3-compatible (tested against Cloudflare R2; works with real AWS S3 too)

## Folder structure

```
BoilerPlate/
├── server/
│   ├── src/
│   │   ├── api.ts              # Entry point — wires everything together
│   │   ├── config/             # Startup config: env validation, DB connection, S3 client, constants
│   │   ├── controllers/        # Route logic (what happens on a request)
│   │   ├── middleware/         # Auth, upload handling, error handling, 404s
│   │   ├── models/             # Mongoose schemas (empty — add as needed)
│   │   ├── routes/             # URL → controller mapping
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── storage/        # Storage abstraction
│   │           ├── index.ts    # Picks local or s3 based on STORAGE_DRIVER
│   │           ├── local.ts    # Local disk implementation
│   │           └── s3.ts       # S3-compatible implementation (R2 or AWS S3)
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

# Storage driver: "local" or "s3"
STORAGE_DRIVER=local

# Only required if STORAGE_DRIVER=s3
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
S3_REGION=auto
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

**Switching to real AWS S3 instead of R2:** remove `S3_ENDPOINT` entirely (AWS infers it from the region) and set `S3_REGION` to a real AWS region (e.g., `eu-west-2`). No code changes needed — only `.env`.

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
| DELETE | `/files/:filename` | Soft-deletes a file (moves to a `deleted/` location) |
| POST | `/files/:filename/restore` | Restores a soft-deleted file |

## Storage driver details

- **`local`** — files saved to `server/uploads/`. Deletes move files to `uploads/deleted/`. `getFileUrl()` returns a static path (`/uploads/<filename>`).
- **`s3`** — files uploaded to the configured bucket. Since the bucket is kept **private** (no public access), `getFileUrl()` returns a **presigned URL** valid for 1 hour (see `PRESIGNED_URL_EXPIRY_SECONDS` in `constants.ts`), not a permanent link. Deletes/restores are implemented as copy-then-delete between the bucket root and a `deleted/` prefix, since S3-compatible storage has no native move/rename operation.
- Both drivers implement the exact same four functions (`saveFile`, `deleteFile`, `restoreFile`, `getFileUrl`), all `async`. Controllers never know which driver is active — only `src/utils/storage/index.ts` decides, based on `STORAGE_DRIVER`.

## Conventions used throughout this codebase

- **ES Modules, not CommonJS** — `import`/`export`, not `require`. Relative imports end in `.js` even though the source files are `.ts` (required by the `NodeNext` module setting in `tsconfig.json`).
- **Every function logs its own lifecycle:**
  - `logger.debug('functionName called')` at the top (dev-only, silent in production)
  - `logger.info(...)` right before a successful response
  - `logger.warn(...)` for bad/invalid requests (client's fault)
  - `logger.error(...)` for genuine failures (server's fault)
- **Constants belong in `config/constants.ts`**, not hardcoded inline — anything that's a fixed number, limit, or list of allowed values.
- **The storage layer is a swappable abstraction** — see "Storage driver details" above.
- **Deletes are soft deletes** on both drivers — files are moved, not destroyed, and can be restored.
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
5. If a project needs user accounts, build auth into that project specifically (not into this shared boilerplate) — reuse the existing logging/validation/error-handling conventions for consistency

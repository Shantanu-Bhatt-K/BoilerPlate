# BoilerPlate

A full-stack starting point: an Express + TypeScript backend and an Expo (React Native) mobile client, so new projects don't start from zero.
## Starting a new project from this boilerplate

Don't use GitHub's "Use this template" button. It cuts the shared history, which
is what makes later updates possible. Clone instead.

**One-time, per machine**

```bash
sudo apt install gh        # or: brew install gh
gh auth login              # choose SSH when asked for the protocol
```

**1. Clone and wire up the remotes**

```bash
cd ~/projects              # keep it on the Linux filesystem, not /mnt/c
git clone git@github.com:Shantanu-Bhatt-K/BoilerPlate.git my-new-app
cd my-new-app

git remote rename origin boilerplate
gh repo create my-new-app --private --source=. --remote=origin
git push -u origin master
```

The rename has to come first, or `gh repo create` fails with "remote origin
already exists". Check both remotes landed:

```bash
git remote -v
# boilerplate  git@github.com:Shantanu-Bhatt-K/BoilerPlate.git
# origin       git@github.com:Shantanu-Bhatt-K/my-new-app.git
```

**2. Branch off**

```bash
git checkout -b dev
git push -u origin dev
```

`master` stays a clean mirror of the boilerplate. All project work happens on
`dev`. Never commit project code to `master`.

**3. Install**

```bash
cd server && npm install
cd ../client && npm install
```

**4. Create `server/.env`**

Variable names are case-sensitive.

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/<db-name>?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development

# "local" or "s3"
STORAGE_DRIVER=local

# Only needed when STORAGE_DRIVER=s3
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
S3_REGION=auto
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Auth
AUTH_ENABLED=true
PUBLIC_REGISTRATION_ENABLED=true
JWT_SECRET=
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRY_DAYS=30
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<a strong password>
```

Generate a fresh secret for every project. Reusing one means a token minted by
one project validates against another.

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

For real AWS instead of R2: drop `S3_ENDPOINT` and set `S3_REGION` to a real
region such as `eu-west-2`. No code changes. `auto` is not a valid AWS region.

The two boolean flags are parsed with `z.stringbool()`, which accepts
`true`/`false`, `1`/`0`, `yes`/`no`, `on`/`off`, case-insensitively. Anything
else throws at startup rather than being silently coerced. An empty value also
throws, so delete unused lines rather than blanking them.

**5. Rename**

- Database name in `MONGODB_URI`
- `name` and `slug` in `client/app.json`
- `name` in `server/package.json` and `client/package.json`

**6. Adjust what the project allows**

- `config/constants.ts` for file size limits, allowed MIME types, rate limits
- `PUBLIC_REGISTRATION_ENABLED=false` if there is no public signup

**7. Run it**

```bash
cd server && npm run dev
cd client && npx expo start --tunnel
```

Use `--tunnel` from the start on WSL2. It sits behind a virtual network adapter
your phone can't route to, so a plain QR code usually won't connect.

**8. Add your own features**

Follow the existing pattern. `auth.*` and `file.*` are the templates.

1. Model in `models/`
2. Validator in `validators/`
3. Controller in `controllers/`
4. Routes in `routes/`, then register the file in `routes/index.ts`
5. Protect routes inline: `router.post('/x', requireAuth(), requireRole('admin'), handler)`

## Pulling boilerplate updates later

```bash
git checkout master
git fetch boilerplate
git merge boilerplate/master      # fast-forward, cannot conflict
git push origin master

git checkout dev
git merge master                  # conflicts, if any, appear here
```

Two merges rather than one keeps `master` a clean mirror. The first can never
conflict because `master` has no commits of its own. If the second goes badly,
`git merge --abort` puts `dev` back untouched.

Branch names must match. This repo uses `master`; GitHub creates new repos with
`main` by default. Mismatching them causes "src refspec does not match any" on
the first push.

## Stack

- **Backend:** Node.js, Express 5, TypeScript, MongoDB (Mongoose 9)
- **Mobile:** Expo (React Native)
- **Auth:** JWT access tokens + server-tracked refresh tokens, with role-based access control
- **Logging:** Pino (structured, leveled, with caller tracing in dev)
- **Validation:** Zod
- **File storage:** Swappable driver, local disk or S3-compatible (tested against Cloudflare R2, works with real AWS S3 too)

---

## Folder structure

```
BoilerPlate/
├── README.md
├── client/                      Expo / React Native app (untouched scaffolding)
│   ├── App.js                   Root component
│   ├── index.js                 Entry point, registers App
│   ├── app.json                 Expo config, app name and slug live here
│   └── assets/                  Icons and splash screen
└── server/
    ├── .env                     Secrets and config, not committed
    ├── eslint.config.js
    ├── tsconfig.json
    ├── .prettierrc
    ├── uploads/                 Local file storage, gitignored
    │   └── deleted/             Soft-deleted files
    ├── dist/                    Compiled output, gitignored
    └── src/
        ├── api.ts               Entry point. Middleware order, route mounting,
        │                        startup sequence, graceful shutdown.
        ├── config/
        │   ├── env.ts           Zod-validated environment variables. Single source
        │   │                    of truth for config. Everything else imports `env`.
        │   ├── constants.ts     Every fixed value: file size limits, rate limits,
        │   │                    salt rounds, timeouts, presigned URL expiry.
        │   ├── db.ts            connectDB(), plus the global sanitizeFilter setting.
        │   ├── auth.ts          initAuth(). Validates auth env vars and creates the
        │   │                    admin account on first boot.
        │   └── s3.ts            initS3() / getS3Client(). Builds the S3 client only
        │                        when STORAGE_DRIVER is "s3".
        ├── controllers/
        │   ├── auth.controller.ts    register, login, refresh, logout, deleteAccount
        │   ├── file.controller.ts    uploadFile, uploadFiles, getFile, deleteFile,
        │   │                         restoreFile
        │   └── health.controller.ts  getHealth
        ├── middleware/
        │   ├── error-handler.ts  The only place request-time errors are logged and
        │   │                     formatted. Mount last.
        │   ├── not-found.ts      404 handler. Mount after all real routes.
        │   ├── require-auth.ts   Factory. Verifies the Bearer token, sets req.user.
        │   ├── require-role.ts   Factory. Checks req.user.role. Must run AFTER
        │   │                     requireAuth, since it reads what requireAuth sets.
        │   └── upload.ts         Multer config: memory storage, size and MIME limits.
        ├── models/
        │   ├── user.model.ts          IUser interface, schema, pre('save') password
        │   │                          hash hook, comparePassword method.
        │   └── refresh-token.model.ts Session records: tokenHash, expiresAt,
        │                              revokedAt, device info. TTL index on
        │                              expiresAt clears expired rows automatically.
        ├── routes/
        │   ├── auth.routes.ts    /auth/* endpoints, plus the stricter auth limiter
        │   ├── file.routes.ts    /files/* endpoints
        │   ├── health.routes.ts  /health
        │   └── index.ts          Combines all route files. The only one api.ts imports.
        ├── types/
        │   ├── auth.types.ts     AccessTokenPayload, shared between jwt.ts,
        │   │                     require-auth.ts and the controllers.
        │   └── express.d.ts      Adds `user` to Express's Request. Never imported,
        │                         TypeScript picks it up automatically.
        ├── utils/
        │   ├── app-error.ts          AppError class. Expected, client-caused failures
        │   │                         that carry a status code.
        │   ├── fatal-error.ts        fatalError(). Log then process.exit(1). Startup
        │   │                         failures only. Returns `never`.
        │   ├── hashing.ts            hashPassword / comparePassword (bcrypt),
        │   │                         generateRawToken / hashToken (SHA-256).
        │   ├── issue-auth-tokens.ts  issueTokens(). Signs an access token and creates
        │   │                         the matching refresh token record.
        │   ├── jwt.ts                signAccessToken / verifyAccessToken.
        │   ├── logger.ts             Configured Pino instance. Pretty output and
        │   │                         caller tracing in dev, plain JSON in production.
        │   ├── send-response.ts      sendResponse(). The one place the response shape
        │   │                         is defined.
        │   ├── validate.ts           Runs a Zod schema, throws AppError(400) on failure.
        │   └── storage/
        │       ├── index.ts          Picks local or s3 from STORAGE_DRIVER. Controllers
        │       │                     never know which driver is active.
        │       ├── local.ts          Local disk implementation.
        │       └── s3.ts             S3-compatible implementation (R2 or AWS S3).
        └── validators/
            ├── auth.validator.ts     validateRegister, validateLogin,
            │                         validateRefreshToken
            └── file.validator.ts     validateFilename. Enforces the UUID + extension
                                      shape, which is what blocks path traversal.
```

---

## Setting up a new project

**1. Install**

```bash
cd server && npm install
cd ../client && npm install
```

**2. Create `server/.env`**

Variable names are case-sensitive.

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/<db-name>?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development

# "local" or "s3"
STORAGE_DRIVER=local

# Only needed when STORAGE_DRIVER=s3
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
S3_REGION=auto
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Auth
AUTH_ENABLED=true
PUBLIC_REGISTRATION_ENABLED=true
JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRY_DAYS=30
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<a strong password>
```

For real AWS instead of R2: drop `S3_ENDPOINT` entirely and set `S3_REGION` to a real region such as `eu-west-2`. No code changes.

The two boolean flags are parsed with `z.stringbool()`, which accepts `true`/`false`, `1`/`0`, `yes`/`no` and `on`/`off`, case-insensitively. Anything else throws at startup rather than being silently coerced, so a typo like `AUTH_ENABLED=ture` fails loudly instead of leaving auth on.

**3. Rename things**

- Change the database name in `MONGODB_URI`
- Update `name` and `slug` in `client/app.json`

**4. Adjust what the project allows**

- `config/constants.ts` for file size limits, allowed MIME types, rate limits
- Set `PUBLIC_REGISTRATION_ENABLED=false` if there is no public signup (see Known issues first)

**5. Add your own features**

Follow the existing pattern. `auth.*` and `file.*` are the templates.

1. Model in `models/`
2. Validator in `validators/`
3. Controller in `controllers/`
4. Routes in `routes/`, then register the file in `routes/index.ts`
5. Protect routes inline: `router.post('/x', requireAuth(), requireRole('admin'), handler)`

---

## Commands

Run inside `server/`:

| Command | What it does |
|---|---|
| `npm run dev` | Dev server, auto-restarts on save, verbose logs |
| `npm run build` | Type-checks and compiles to `dist/` |
| `npm run start` | Runs the compiled build in production mode |
| `npm run lint` | Checks for issues |
| `npm run format` | Formats with Prettier |

Run inside `client/`:

| Command | What it does |
|---|---|
| `npx expo start` | Dev server, scan the QR code with Expo Go |
| `npx expo start --tunnel` | Routes through Expo's servers. Use this if the QR code won't connect, common on WSL2 and phone hotspots |

---

## API

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Health check |
| POST | `/auth/register` | none | Create an account, returns both tokens |
| POST | `/auth/login` | none | Returns both tokens |
| POST | `/auth/refresh` | refresh token in body | Returns a new access token |
| POST | `/auth/logout` | refresh token in body | Revokes that refresh token |
| DELETE | `/auth/delete/me` | Bearer | Soft-deletes the account, revokes all its sessions |
| POST | `/files` | none | Upload one file (field name: `file`) |
| POST | `/files/batch` | none | Upload several (field name: `files`) |
| GET | `/files/:filename` | none | Download a file. Local driver only |
| DELETE | `/files/:filename` | none | Soft-deletes a file |
| POST | `/files/:filename/restore` | none | Restores a soft-deleted file |

File routes are unauthenticated. Add `requireAuth()` in `file.routes.ts` before deploying anything real.

Every response, success or failure, has the same shape:

```json
{ "message": "Login successful", "data": { "accessToken": "...", "refreshToken": "..." } }
```

`data` is `null` when there is nothing to return.

---

## How the pieces work

**Auth.** Two tokens doing different jobs. The access token is a JWT holding `{ userId, role }`, short-lived, verified by signature alone with no database lookup, which is exactly why it can't be revoked early. The refresh token is a random opaque string, not a JWT, stored only as a SHA-256 hash and verified by lookup, which is what makes revocation possible. There is no rotation: a refresh token works until it expires or is revoked.

Automatic refresh belongs in the client. On a 401, call `/auth/refresh` and retry. Doing it in middleware would force a database read on every request and defeat the point of the access token.

**Errors.** Three categories, one tool each.

| Situation | Tool | Result |
|---|---|---|
| Can't start (bad config, DB down) | `fatalError(msg, err?)` | Logs, exits 1 |
| Expected client-caused failure | `throw new AppError(status, msg)` | Logged at warn, returns that status |
| A real bug | let it throw | Logged at error, returns generic 500 |

Controllers have no `try/catch` and never call `next(err)`, because Express 5 forwards rejected promises from async handlers to error middleware automatically. `logger.error()` is called in exactly two places: `errorHandler` and `fatalError`.

**Files.** Filenames are always `<uuid>.<ext>`, where the extension is derived from the validated MIME type rather than the uploaded filename, so the two can never disagree. `validateFilename` enforces that shape on every route that takes one, and both drivers re-check containment independently. Downloads are served with `Content-Disposition: attachment`.

Nothing is hard-deleted. Files move to a `deleted/` location and can be restored. Users get a `deletedAt` date and all their refresh tokens are revoked in the same operation. Every auth lookup filters `deletedAt: null`, by convention rather than by schema, so remember it when adding new ones.

**Storage drivers.** Both implement the same five functions (`saveFile`, `readFile`, `deleteFile`, `restoreFile`, `getFileUrl`), though `readFile` throws on the S3 driver and `getFile` guards against it. Local returns a URL through `/api/files/`. S3 keeps the bucket private and returns a presigned URL valid for one hour, so local URLs are permanent and S3 URLs expire. Same interface, different lifetime.

**Rate limiting.** A global limiter on everything, plus a stricter one on `/auth/register` and `/auth/login`. The auth limiter uses `skipSuccessfulRequests`, so only failed attempts count: a real user logging in repeatedly never trips it, a password guesser burns through it in a few tries. `/auth/refresh` and `/auth/logout` are deliberately unlimited. Counters are in memory and reset on restart.

---

## Things not to undo

- **Don't add a NoSQL sanitizing middleware.** `express-mongo-sanitize` is abandoned and breaks on Express 5, where it mutates the now read-only `req.query`. Protection comes from three layers instead: strict Mongoose schema casting, per-endpoint Zod validation, and `mongoose.set('sanitizeFilter', true)` in `config/db.ts`.
- **Don't downgrade to Express 4.** The no-`try/catch` controller pattern depends on Express 5 forwarding async rejections.
- **Keep the `.js` extensions on relative imports.** Sources are `.ts` but `NodeNext` requires it. CommonJS packages with broken types (`pino-http`, `pino-caller`) come in via `createRequire`.
- **Middleware are factories.** Write `requireAuth()` and `requireRole('admin')` with parentheses. The outer call runs its startup check once, the returned function runs per request.

---

## Known issues

- **File routes have no authentication.** Anyone can upload, download, delete or restore. Add `requireAuth()` before deploying.
- **Multer rejections return 500 instead of 400.** `fileFilter` throws a plain `Error`, and `MulterError` for oversized files isn't handled either, so a bad type or an oversized upload looks like a server bug.
- **No `app.set('trust proxy')`.** Behind a reverse proxy, `req.ip` is the proxy, so rate limiting collapses into one shared bucket and the IP recorded on refresh tokens is useless.
- **The startup chain has no `.catch()`.** If `initAuth()` throws, you get an unhandled rejection rather than the intended `fatalError` path.
- **`uploadFiles` discards failure reasons.** It counts rejections from `Promise.allSettled` but never logs `r.reason`, so a partial batch failure can't be diagnosed.
- **CORS is wide open.** `cors()` with no options. Low risk while the client is a mobile app using `Authorization` headers, but add an allowlist as soon as a browser frontend exists.
- **A deleted email can't be re-registered.** `register` deliberately doesn't filter `deletedAt`, because the unique index still holds the address. Users get a clean 409 instead of a confusing 500. To allow reuse, drop `unique: true` and add a partial index (`{ unique: true, partialFilterExpression: { deletedAt: null } }`), then drop the old index in Atlas.
- **Deleting the bootstrapped admin leaves no admin.** `initAuth()` finds the soft-deleted record and skips recreation. Recovery: change `ADMIN_EMAIL` and restart.
- **Storage errors return 500, not 404.** `deleteFile` and `restoreFile` can't tell a missing file from a real failure.
- **Expo DevTools fail on WSL** due to missing Chromium libraries. Doesn't block the app, only the in-app JS debugger.
  ```bash
  sudo apt install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libpangocairo-1.0-0
  ```

## Not built yet

- Automated tests (Vitest + Supertest). Nothing is covered; the auth flow has only been tested manually.
- CORS allowlist, for when a browser frontend exists.

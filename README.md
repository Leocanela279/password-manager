<p align="center">
  <img src="./docs/cinnamon-key-logo.png" alt="Cinnamon Key logo" width="720" />
</p>

<h1 align="center">Cinnamon Key</h1>

<p align="center">
  A local-first password manager built with Electron, Vue and SQLite.
</p>

<p align="center">
  Cinnamon Key is a desktop vault focused on a clean dark interface, local credential storage and a simple workflow:
  create an account, unlock your vault, save entries, inspect their status and copy passwords quickly when you need them.
</p>

## About The Project

Cinnamon Key is a desktop password manager split into two main parts:

- `desktop/`: Electron main process, preload bridge, SQLite access and encryption logic.
- `frontend/`: Vue application that renders the auth flow, dashboard and record management UI.

The goal of the project is to provide a focused, local-first password manager experience with a more intentional desktop feel than a browser tab. The current app already supports:

- user registration and login
- local account storage in SQLite
- password hashing for user accounts with `bcrypt`
- encrypted vault entries using `crypto.scrypt` + `aes-256-cbc`
- vault unlock flow with a master password
- credential listing, filtering and quick copy actions
- a dedicated "new entry" screen that can save a record without opening the entire dashboard vault view

## What Cinnamon Key Does

Once the app is running, the current flow looks like this:

1. A user creates an account from the register screen.
2. The account password is hashed before being stored in the local database.
3. The user logs in from the Electron desktop app.
4. Inside the dashboard, the vault stays locked until the master password is entered.
5. Saved credentials are encrypted before writing them to the database.
6. When the vault is unlocked, credentials are decrypted and rendered in the UI.

From the interface you can currently:

- create a new local account
- log into the application
- unlock the vault with the master password
- create password records from the dashboard
- create password records from a dedicated sidebar route
- search by provider or domain
- sort records
- mark weak or repeated entries for quick review
- reveal or copy passwords from each row

## Screens And UX

The UI currently includes:

- a compact login screen with a dark product-style presentation
- a matching registration screen
- a responsive desktop-oriented dashboard with sidebar navigation
- a dedicated `Nuevo registro` screen for fast entry creation

The design direction aims for:

- serious dark surfaces
- clear hierarchy and less visual noise
- a more "native app" feeling than a typical generic dashboard

## Project Structure

```text
password-manager/
├── desktop/
│   ├── main.js
│   ├── preload.js
│   ├── database.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── router/
│   │   └── stores/
│   └── package.json
├── docs/
│   ├── cinnamon-key-logo.png
│   └── cinnamon-key-mascot.svg
└── README.md
```

## Tech Stack

### Desktop layer

- Electron
- Node.js
- SQLite
- `bcrypt`
- Node `crypto`

### Frontend layer

- Vue 3
- Vue Router
- Pinia
- Tailwind CSS v4
- Vite

## Local Database Model

The SQLite database is created inside Electron's `userData` directory.

Current tables:

### `users`

- `id`
- `username`
- `email`
- `password`

### `passwords`

- `id`
- `user_id`
- `provider`
- `password`
- `iv`
- `link`

## Security Notes

The current codebase already applies basic protection measures:

- user account passwords are hashed with `bcrypt`
- saved credentials are encrypted before being persisted
- the encryption key is derived from the supplied master password with `scrypt`
- each saved credential gets its own IV

That said, this is still an evolving project and there are areas that should be improved before calling it production-grade. For example:

- the current key derivation flow uses a static salt in the desktop process
- there is still room to harden validation, error handling and credential lifecycle rules
- packaging, signing and release workflow are not yet fully documented in this repo

So the honest description is: this is a solid local project foundation with real encryption and desktop structure, but not yet a finished security product.

## How To Run The Project

Because the Electron window loads the Vite dev server, the app currently runs in two processes during development.

### 1. Start the frontend

```bash
cd frontend
pnpm install
pnpm dev
```

This serves the UI at `http://localhost:5173`.

### 2. Start the Electron app

In a second terminal:

```bash
cd desktop
pnpm install
pnpm run start
```

This launches the desktop shell and loads the frontend.

## Development Notes

Some practical repo details:

- the Electron app entrypoint is `desktop/main.js`
- the preload bridge is exposed through `desktop/preload.js`
- database bootstrap lives in `desktop/database.js`
- the frontend routes live in `frontend/src/router/router.js`
- dashboard and auth pages are inside `frontend/src/pages/`

## Current Status

Cinnamon Key is already useful as a local desktop prototype and portfolio project. It demonstrates:

- Electron app structure
- Vue UI composition
- local SQLite persistence
- hashed authentication
- encrypted credential storage
- route-based desktop dashboard design

It is especially well suited for:

- learning Electron + Vue integration
- experimenting with local-first desktop product UX
- building a stronger password manager MVP
- using as a base for future features like import/export, categories, generator, audit tools or secure sync

## Possible Next Steps

Good next improvements for the project would be:

- password generator
- per-entry category/tag system
- editable existing records
- delete/archive flow
- stronger key management and per-user salts
- persistent sessions
- packaged desktop releases for macOS, Windows and Linux
- test coverage for the desktop IPC and crypto flow

## Brand Note

The README now uses the Cinnamon Key logo artwork as the main project banner. The extra SVG mascot file is kept in the repo as an auxiliary branding asset for future docs, splash screens or app visuals.

---

If you want, the next step can be turning this README into a more polished landing-style open source page with badges, screenshots and a feature roadmap section.

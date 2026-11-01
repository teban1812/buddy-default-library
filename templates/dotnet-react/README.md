# buddy-app

A .NET 10 minimal API (`src/BuddyApp.Api`) with xUnit tests (`tests/BuddyApp.Api.Tests`)
and a React + Vite + TypeScript web app (`web/`) tested with Vitest and Testing Library.

## Requirements

- .NET SDK 10
- Node.js 24 and npm

## Setup and validation

```sh
npm run setup      # installs the web dependencies (npm ci in web/)
npm run validate   # runs the .NET tests, then the web tests
```

## Run in development

In one terminal, start the API on http://localhost:5080:

```sh
dotnet run --project src/BuddyApp.Api
```

In another, start the web app (Vite proxies `/api` to the API):

```sh
npm --prefix web run dev
```

Then open the URL Vite prints (http://localhost:5173 by default). The page shows the API status
from `GET /api/health`.

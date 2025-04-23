# hono-mas

Auto route loader for Hono framework – load routes from filesystem with optional middleware support and hot reload (in dev mode).

## 🔧 Installation

```bash
bun add hono-mas
```

or

```bash
npm install hono-mas
```

## 🚀 Usage

This package allows you to auto-load API routes from a folder (default: `./api`) and mount them to your `Hono` app.

### Example

```ts
import { Hono } from "hono";
import { loadRoutes } from "hono-mas";

const app = new Hono();

const server = async () => {
  await loadRoutes(app); // Loads all routes from ./api recursively

  console.log("🚀 Server running on http://localhost:3000");

  Bun.serve({
    fetch: app.fetch,
    port: 3000,
  });
};

server();
```

## 📁 File Structure

Example directory structure for auto-loading:

```
api/
├── route.ts                 // Handles GET, POST, etc.
├── parentMiddleware.ts      // Middleware applied to this folder and children
└── users/
    ├── route.ts             // Will be mounted at /api/users
    └── parentMiddleware.ts
```

## ✅ Features

- ✅ Recursive route loading
- ✅ Folder-based middleware (`parentMiddleware.ts`)
- ✅ Supports per-method middleware (`GET_middleware`, `POST_middleware`, etc.)
- ✅ Supports hot reload in dev mode (using `watch`)

## 🛠 Custom Options

```ts
await loadRoutes(app, "./my-folder", "/custom-path", [yourMiddleware], true);
```

## 🧪 Validation Helper

Also includes a helper for Zod schema validation:

```ts
import { Schema } from "hono-mas";

app.post("/example", async (c) => {
  const body = await c.req.json();
  return Schema(body, schema, c);
});
```

## 📝 License

MIT
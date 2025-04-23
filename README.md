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

This package allows you to auto-load API routes from a folder (default: `./api`) and mount them to your Hono app.

> ⚠️ You **must** create at least:
> - an `index.js` file (to initialize the app and call `loadRoutes`)
> - a `route.ts` file (inside your `api` folder) to define at least one route

### Minimal Setup

**index.js**
```ts
import { Hono } from "hono";
import { loadRoutes } from "hono-mas";

const app = new Hono();

const server = async () => {
  await loadRoutes(app); // Loads all routes from ./api

  console.log("🚀 Server running on http://localhost:3000");

  Bun.serve({
    fetch: app.fetch,
    port: 3000,
  });
};

server();
```

**api/route.ts**
```ts
export const GET = (c) => {
  return c.text("Hello from root route!");
};
```

## 📁 File Structure

Example directory structure for auto-loading:

```
api/
├── route.ts                 // Handles GET, POST, etc. for `/api`
├── parentMiddleware.ts      // Middleware applied to this folder and children
└── users/
    ├── route.ts             // Will be mounted at /api/users
    └── parentMiddleware.ts
```

## ✅ Features

- ✅ Recursive route loading
- ✅ Folder-based middleware (`parentMiddleware.ts`)
- ✅ Supports per-method middleware (`GET_middleware.ts`, `POST_middleware.ts`, etc.)
- ✅ Supports hot reload in dev mode (using watch)

## 🧱 Middleware Usage Guide

### Folder-level middleware

To apply middleware to a folder and its children, create a file named `parentMiddleware.ts` in that folder:

```ts
import { MiddlewareHandler } from "hono";

const middleware: MiddlewareHandler = async (c, next) => {
  console.log("Folder-level middleware executed");
  await next();
};

export default middleware;
```

### Method-specific middleware

To apply middleware for a specific HTTP method, create files like `GET_middleware.ts`, `POST_middleware.ts`, etc.:

```ts
import { MiddlewareHandler } from "hono";

const GET_middleware: MiddlewareHandler = async (c, next) => {
  console.log("GET middleware triggered");
  await next();
};

export default GET_middleware;
```

## 🛠 Custom Options

You can customize the behavior of route loading:

```ts
await loadRoutes(app, "./my-folder", "/custom-path", [yourMiddleware], true);
```

- `./my-folder` – source directory for route files
- `/custom-path` – base route path
- `[yourMiddleware]` – global middleware applied to all routes
- `true` – enable hot reload

## 🧪 Validation Helper

Also includes a helper for Zod schema validation:

```ts
import { Schema } from "hono-mas";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
});

app.post("/example", async (c) => {
  const body = await c.req.json();
  return Schema(body, schema, c);
});
```

## 📝 License

MIT
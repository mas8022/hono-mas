import { Hono } from "hono";
import { readdirSync, statSync, watch } from "fs";
import { join, resolve, sep } from "path";
import type { Handler, MiddlewareHandler, Context } from "hono";

const mountedRoutes = new Map<string, Hono>();

export async function loadRoutes(
  app: Hono,
  baseDir = "./api",
  basePath = "",
  parentMiddlewares: MiddlewareHandler[] = [],
  isDev = false
) {
  const fullPath = resolve(baseDir);
  const files = readdirSync(fullPath);

  // parentMiddleware
  const parentMiddlewareFile = files.find((f) =>
    /^parentMiddleware\.(ts|js)$/.test(f)
  );
  const currentParentMiddlewares = [...parentMiddlewares];

  if (parentMiddlewareFile) {
    const mod = await import(
      join(fullPath, parentMiddlewareFile) + `?t=${Date.now()}`
    );
    const middleware = mod.default as MiddlewareHandler | undefined;
    if (middleware) {
      currentParentMiddlewares.push(middleware);
    }
  }

  for (const file of files) {
    const full = join(fullPath, file);
    const isDir = statSync(full).isDirectory();

    if (isDir) {
      await loadRoutes(
        app,
        full,
        join(basePath, file),
        currentParentMiddlewares,
        isDev
      );
    } else if (/^route\.(ts|js)$/.test(file)) {
      const filePath = resolve(full);
      let routePath = "/api/" + basePath.replaceAll(sep, "/");
      routePath = routePath.replace(/\/index$/, "");
      routePath = routePath.replace(/\[(.+?)\]/g, ":$1");

      const importFresh = async () =>
        await import(filePath + `?update=${Date.now()}`); // bust cache

      const setupRoute = async () => {
        const mod = await importFresh();
        const route = new Hono();

        const fileMiddleware = mod.middleware as MiddlewareHandler | undefined;
        if (fileMiddleware) route.use("/", fileMiddleware);

        const METHODS = [
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "PATCH",
          "OPTIONS",
          "HEAD",
        ] as const;

        for (const method of METHODS) {
          const handler = mod[method] as Handler | undefined;
          const methodMiddleware = mod[`${method}_middleware`] as
            | MiddlewareHandler
            | undefined;

          if (handler) {
            const allMiddleware = [...currentParentMiddlewares];
            if (methodMiddleware) allMiddleware.push(methodMiddleware);
            allMiddleware.push(handler);

            // Casting methodLowerCase to ensure it works as a callable method
            const methodLowerCase = method.toLowerCase() as keyof Hono; // Ensuring TypeScript knows it's a valid method
            (route[methodLowerCase] as Function)("/", ...allMiddleware); // Explicitly casting to Function to call it
          }
        }

        // Mount route
        app.route(routePath || "/api", route);
        mountedRoutes.set(filePath, route);
      };

      await setupRoute();

      // HOT RELOAD (only this route)
      if (isDev) {
        watch(full, async (event) => {
          if (event === "change") {
            console.log(`♻️ Reloading ${routePath}`);
            mountedRoutes.delete(filePath);
            await setupRoute();
          }
        });
      }
    }
  }
}

export const Schema = async (data: any, schema: any, c: Context) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    return c.json({ error: result.error.format() }, 400);
  }
};

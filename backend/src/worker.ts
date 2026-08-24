process.env.CLOUDFLARE_WORKER = "true";

import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import app from "./server.js";

// Propagate Cloudflare Worker environment variables to process.env
function applyWorkerEnv(env: Record<string, unknown>) {
  if (env && typeof env === "object") {
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === "string" && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Record<string, unknown>, _ctx: unknown): Promise<Response> {
    applyWorkerEnv(env);

    return new Promise<Response>((resolve, reject) => {
      try {
        const url = new URL(request.url);

        const reqStream = new Readable({
          read() {},
        });

        if (request.body) {
          const reader = request.body.getReader();
          (async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                reqStream.push(null);
                break;
              }
              reqStream.push(Buffer.from(value));
            }
          })().catch((err) => reqStream.destroy(err));
        } else {
          reqStream.push(null);
        }

        const req = Object.assign(reqStream, {
          url: url.pathname + url.search,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          httpVersion: "1.1",
          httpVersionMajor: 1,
          httpVersionMinor: 1,
          connection: { remoteAddress: request.headers.get("cf-connecting-ip") || "127.0.0.1" },
          socket: { remoteAddress: request.headers.get("cf-connecting-ip") || "127.0.0.1" },
        });

        let statusCode = 200;
        let statusMessage = "OK";
        const responseHeaders = new Headers();
        const bodyChunks: Buffer[] = [];
        const resEmitter = new EventEmitter();

        const res = Object.assign(resEmitter, {
          statusCode,
          statusMessage,
          headersSent: false,
          setHeader(name: string, value: string | string[]) {
            if (Array.isArray(value)) {
              responseHeaders.delete(name);
              value.forEach((v) => responseHeaders.append(name, v));
            } else {
              responseHeaders.set(name, String(value));
            }
            return res;
          },
          getHeader(name: string) {
            return responseHeaders.get(name);
          },
          removeHeader(name: string) {
            responseHeaders.delete(name);
          },
          hasHeader(name: string) {
            return responseHeaders.has(name);
          },
          writeHead(code: number, messageOrHeaders?: unknown, headers?: Record<string, string>) {
            this.statusCode = code;
            if (typeof messageOrHeaders === "string") {
              this.statusMessage = messageOrHeaders;
            } else if (typeof messageOrHeaders === "object" && messageOrHeaders !== null) {
              headers = messageOrHeaders as Record<string, string>;
            }
            if (headers) {
              Object.entries(headers).forEach(([k, v]) => this.setHeader(k, v));
            }
            this.headersSent = true;
            return res;
          },
          write(chunk: unknown) {
            if (chunk) {
              bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
            }
            return true;
          },
          end(chunk?: unknown) {
            if (chunk) {
              bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
            }
            this.headersSent = true;
            const fullBody = Buffer.concat(bodyChunks);
            resolve(
              new Response(fullBody, {
                status: this.statusCode,
                headers: responseHeaders,
              }),
            );
            resEmitter.emit("finish");
            return res;
          },
        });

        // Dispatch request to Express app
        app(req as any, res as any);
      } catch (err) {
        reject(err);
      }
    });
  },
};

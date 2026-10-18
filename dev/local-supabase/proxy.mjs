// Porta única no estilo Supabase (http://localhost:54321) para os testes locais:
//   /rest/v1/*     -> PostgREST
//   /auth/v1/*     -> GoTrue (Supabase Auth)
//   /storage/v1/*  -> armazenamento simples em disco (só o que o app usa: upload, link assinado, remover)
// Só para desenvolvimento. Em produção é o Supabase de verdade.
import http from "node:http";
import { createHmac, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const PORT = Number(process.env.PORT ?? 54321);
const REST = process.env.REST_URL ?? "http://127.0.0.1:3001";
const AUTH = process.env.AUTH_URL ?? "http://127.0.0.1:9999";
const FILES = process.env.STORAGE_DIR ?? "/var/lib/postgresql/local-supabase/storage";
const SECRET = process.env.JWT_SECRET;

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-upsert, prefer, range, accept-profile, content-profile, x-supabase-api-version",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-expose-headers": "content-range, content-location",
};

function forward(req, res, target, strip) {
  const url = new URL(req.url.slice(strip.length) || "/", target);
  const headers = { ...req.headers, host: url.host };
  const p = http.request(url, { method: req.method, headers }, (r) => {
    res.writeHead(r.statusCode, { ...r.headers, ...cors });
    r.pipe(res);
  });
  p.on("error", (e) => send(res, 502, { message: `upstream ${target}: ${e.message}` }));
  req.pipe(p);
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", ...cors });
  res.end(JSON.stringify(body));
}

function body(req) {
  return new Promise((ok) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => ok(Buffer.concat(chunks)));
  });
}

// Aceita só JWT assinado com o segredo local (anon, usuário logado ou service_role)
function authorized(req) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return false;
  const expect = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  return expect === s;
}

const sign = (path) => createHmac("sha256", SECRET).update(path).digest("base64url");
const safe = (bucket, path) => {
  const full = normalize(join(FILES, bucket, path));
  if (!full.startsWith(normalize(join(FILES, bucket)) + "/")) throw new Error("caminho inválido");
  return full;
};

async function storage(req, res) {
  const u = new URL(req.url, "http://x");
  const parts = u.pathname.replace(/^\/storage\/v1\/object\//, "").split("/").map(decodeURIComponent);

  // GET /object/sign/<bucket>/<path>?token=  -> arquivo (link assinado, sem login)
  if (req.method === "GET" && parts[0] === "sign") {
    const [, bucket, ...rest] = parts;
    const key = rest.join("/");
    if (u.searchParams.get("token") !== sign(`${bucket}/${key}`)) return send(res, 400, { message: "token inválido" });
    const file = safe(bucket, key);
    if (!existsSync(file)) return send(res, 404, { message: "não encontrado" });
    const meta = existsSync(file + ".type") ? readFileSync(file + ".type", "utf8") : "application/octet-stream";
    res.writeHead(200, { "content-type": meta, ...cors });
    return res.end(readFileSync(file));
  }

  if (!authorized(req)) return send(res, 401, { message: "não autorizado" });

  // POST /object/sign/<bucket>  { paths: [...] } -> [{ path, signedURL, error }]
  if (req.method === "POST" && parts[0] === "sign" && parts.length === 2) {
    const bucket = parts[1];
    const { paths = [] } = JSON.parse((await body(req)).toString() || "{}");
    return send(res, 200, paths.map((p) => ({
      path: p,
      signedURL: existsSync(safe(bucket, p)) ? `/object/sign/${bucket}/${p}?token=${sign(`${bucket}/${p}`)}` : null,
      error: existsSync(safe(bucket, p)) ? null : "Not found",
    })));
  }

  // POST /object/sign/<bucket>/<path> -> { signedURL }
  if (req.method === "POST" && parts[0] === "sign") {
    const [, bucket, ...rest] = parts;
    const key = rest.join("/");
    return send(res, 200, { signedURL: `/object/sign/${bucket}/${key}?token=${sign(`${bucket}/${key}`)}` });
  }

  // POST|PUT /object/<bucket>/<path> -> grava
  if (req.method === "POST" || req.method === "PUT") {
    const [bucket, ...rest] = parts;
    const key = rest.join("/");
    const file = safe(bucket, key);
    if (existsSync(file) && req.headers["x-upsert"] !== "true") return send(res, 409, { message: "já existe", error: "Duplicate" });
    mkdirSync(dirname(file), { recursive: true });
    let data = await body(req);
    let type = req.headers["content-type"] ?? "application/octet-stream";
    // supabase-js manda Blob dentro de um multipart/form-data: guarda só a parte do arquivo
    const boundary = type.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (type.startsWith("multipart/form-data") && boundary) {
      const sep = Buffer.from(`--${boundary[1] ?? boundary[2]}`);
      let at = data.indexOf(sep);
      while (at !== -1) {
        const next = data.indexOf(sep, at + sep.length);
        if (next === -1) break;
        const part = data.subarray(at + sep.length + 2, next - 2); // tira \r\n
        const headEnd = part.indexOf("\r\n\r\n");
        const head = part.subarray(0, headEnd).toString();
        if (/filename=/.test(head)) {
          type = head.match(/content-type:\s*([^\r\n]+)/i)?.[1] ?? "application/octet-stream";
          data = part.subarray(headEnd + 4);
          break;
        }
        at = next;
      }
    }
    writeFileSync(file, data);
    writeFileSync(file + ".type", type);
    return send(res, 200, { Key: `${bucket}/${key}`, Id: randomBytes(8).toString("hex") });
  }

  // DELETE /object/<bucket>  { prefixes: [...] }
  if (req.method === "DELETE") {
    const [bucket] = parts;
    const { prefixes = [] } = JSON.parse((await body(req)).toString() || "{}");
    for (const k of prefixes) rmSync(safe(bucket, k), { force: true });
    return send(res, 200, prefixes.map((name) => ({ name })));
  }

  send(res, 404, { message: "rota de storage não suportada no ambiente local" });
}

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }
    if (req.url.startsWith("/rest/v1")) return forward(req, res, REST, "/rest/v1");
    if (req.url.startsWith("/auth/v1")) return forward(req, res, AUTH, "/auth/v1");
    if (req.url.startsWith("/storage/v1/object/")) return storage(req, res).catch((e) => send(res, 400, { message: e.message }));
    send(res, 404, { message: "não encontrado" });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`supabase local em http://127.0.0.1:${PORT}`));

// Gera as chaves anon e service_role do ambiente local (JWT HS256 com o segredo local).
// Uso: node keys.mjs <segredo>  -> imprime ANON_KEY=... e SERVICE_ROLE_KEY=...
import { createHmac } from "node:crypto";

const secret = process.argv[2];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role) => {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ iss: "supabase-local", role, iat: 1760000000, exp: 2000000000 });
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
};

console.log(`ANON_KEY=${jwt("anon")}`);
console.log(`SERVICE_ROLE_KEY=${jwt("service_role")}`);

// Gera src/app/tokens.css a partir de replica/design/tokens.json.
// Os componentes usam só as classes geradas (bg-surface, text-muted...), nunca hex direto.
// Rode depois de mudar os tokens: npm run tokens
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../replica/design/tokens.json");
const out = resolve(here, "../src/app/tokens.css");
const t = JSON.parse(readFileSync(src, "utf8"));

const px = (n) => `${n / 16}rem`;
const root = [];
const theme = [];

// "text" vira fg e "text-muted" vira muted, para a classe ser text-fg / text-muted e não text-text-muted
const alias = (name) => (name === "text" ? "fg" : name.replace(/^text-/, ""));
for (const [name, value] of Object.entries(t.color)) {
  root.push(`  --${name}: ${value};`);
  theme.push(`  --color-${alias(name)}: var(--${name});`);
}

theme.push(`  --font-sans: ${t.font.sans};`);
theme.push(`  --font-mono: ${t.font.mono};`);

for (const [name, s] of Object.entries(t.type)) {
  theme.push(`  --text-${name}: ${px(s.size)};`);
  theme.push(`  --text-${name}--line-height: ${px(s.line)};`);
  theme.push(`  --text-${name}--font-weight: ${s.weight};`);
}

for (const [name, r] of Object.entries(t.radius)) {
  theme.push(`  --radius-${name}: ${r === 999 ? "9999px" : px(r)};`);
}
for (const [name, s] of Object.entries(t.shadow)) theme.push(`  --shadow-${name}: ${s};`);

theme.push(`  --ease-standard: ${t.motion.ease};`);
for (const [name, bp] of Object.entries(t.layout.breakpoints)) theme.push(`  --breakpoint-${name}: ${px(bp)};`);

root.push(`  --duration-fast: ${t.motion.fast};`);
root.push(`  --duration-base: ${t.motion.base};`);
for (const key of ["sidebar", "header", "content-max", "touch-min", "bottom-nav"]) {
  root.push(`  --layout-${key}: ${px(t.layout[key])};`);
}

const css = `/* Gerado por scripts/tokens.mjs a partir de replica/design/tokens.json. Não edite à mão. */

:root {
${root.join("\n")}
}

@theme inline {
${theme.join("\n")}
}
`;

writeFileSync(out, css);
// cópia para a página /design (o build não lê fora de web/)
writeFileSync(resolve(here, "../src/app/design/tokens.generated.json"), JSON.stringify(t, null, 2) + "\n");
console.log(`tokens.css: ${Object.keys(t.color).length} cores, ${Object.keys(t.type).length} tamanhos de texto`);

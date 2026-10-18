export type ActionResult = { ok?: true; error?: string; id?: string };

// Erros do banco em português para quem está usando. As regras (P0001) já vêm escritas pelo schema.
export function explain(e: { code?: string; message: string }) {
  if (e.code === "P0001") return e.message;
  if (e.code === "42501" || /row-level security/i.test(e.message)) return "Você não tem permissão para isso.";
  if (e.code === "23505") return "Já existe um registro com esses dados.";
  if (e.code === "23503") return "Esse registro está em uso e não pode ser removido.";
  return "Não foi possível salvar. Tente de novo.";
}

export const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

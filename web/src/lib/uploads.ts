"use client";

import { getBrowserClient } from "@/lib/supabase/client";
import { BUCKET_EVIDENCE, BUCKET_SIGNATURES } from "@/lib/buckets";

// Foto do celular tem 3–8 MB. Reduz para no máximo 1600 px e JPEG 80% (fica < 1 MB),
// para subir rápido no 4G da fábrica e caber no limite do banco (10 MB).
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((ok) => canvas.toBlob((b) => ok(b ?? file), "image/jpeg", quality));
}

// Sobe a foto e registra o anexo na OS. O banco confere se o usuário pode ver a OS.
export async function uploadEvidence(workOrderId: string, file: File, opts: { checklistItemId?: string; uploadedBy: string }) {
  const supabase = getBrowserClient();
  const blob = await compressImage(file);
  const path = `${workOrderId}/${crypto.randomUUID()}.jpg`;
  const up = await supabase.storage.from(BUCKET_EVIDENCE).upload(path, blob, { contentType: "image/jpeg" });
  if (up.error) throw new Error(`Falha ao enviar a foto: ${up.error.message}`);
  const { error } = await supabase.from("attachments").insert({
    work_order_id: workOrderId,
    checklist_item_id: opts.checklistItemId ?? null,
    storage_path: path,
    mime_type: "image/jpeg",
    size_bytes: blob.size,
    uploaded_by: opts.uploadedBy,
    taken_at: new Date().toISOString(),
  });
  if (error) {
    await supabase.storage.from(BUCKET_EVIDENCE).remove([path]);
    throw new Error(`Falha ao registrar a foto: ${error.message}`);
  }
  return path;
}

export async function uploadSignature(
  workOrderId: string,
  pngDataUrl: string,
  signer: { role: "technician" | "responsible"; name: string; id?: string },
) {
  const supabase = getBrowserClient();
  const blob = await (await fetch(pngDataUrl)).blob();
  const path = `${workOrderId}/${signer.role}-${crypto.randomUUID()}.png`;
  const up = await supabase.storage.from(BUCKET_SIGNATURES).upload(path, blob, { contentType: "image/png" });
  if (up.error) throw new Error(`Falha ao enviar a assinatura: ${up.error.message}`);
  // uma assinatura por papel: assinar de novo substitui
  const { error } = await supabase.from("signatures").upsert(
    {
      work_order_id: workOrderId,
      signer_role: signer.role,
      signer_name: signer.name,
      signer_id: signer.id ?? null,
      storage_path: path,
      signed_at: new Date().toISOString(),
    },
    { onConflict: "work_order_id,signer_role" },
  );
  if (error) throw new Error(`Falha ao registrar a assinatura: ${error.message}`);
}

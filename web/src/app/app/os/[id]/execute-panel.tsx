"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Play, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { SignatureField } from "@/components/signature-field";
import { setStatus } from "@/lib/actions/work-orders";
import { uploadEvidence, uploadSignature } from "@/lib/uploads";
import type { WorkOrderStatus } from "@/lib/domain";

type Props = {
  wo: { id: string; number: number; status: WorkOrderStatus };
  me: { id: string; name: string };
  canWork: boolean;
  requireSignature: boolean;
  photos: { id: string; url: string }[];
  signature: { name: string; url: string; at: string } | null;
};

export function ExecutePanel({ wo, me, canWork, requireSignature, photos, signature }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [sigPng, setSigPng] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const onSig = useCallback((png: string | null) => setSigPng(png), []);

  const closed = wo.status === "done" || wo.status === "cancelled";
  const started = wo.status === "in_progress" || wo.status === "waiting_material";

  function change(status: WorkOrderStatus, okMsg: string) {
    setError(undefined);
    start(async () => {
      const res = await setStatus(wo.id, status);
      if (res.error) return setError(res.error);
      toast.success(okMsg);
      router.refresh();
    });
  }

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await uploadEvidence(wo.id, file, { uploadedBy: me.id });
      toast.success("Foto anexada");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function finish() {
    setError(undefined);
    start(async () => {
      try {
        // assinatura nova sobe antes; o banco confere checklist e assinatura ao concluir
        if (sigPng) await uploadSignature(wo.id, sigPng, { role: "technician", name: me.name, id: me.id });
      } catch (e) {
        return setError((e as Error).message);
      }
      const res = await setStatus(wo.id, "done");
      if (res.error) return setError(res.error);
      toast.success(`OS #${wo.number} concluída`);
      router.push("/app");
    });
  }

  return (
    <>
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium">Fotos ({photos.length})</p>
        {photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.id}>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- link assinado temporário do Storage */}
                  <img src={p.url} alt={`Foto ${i + 1} da OS`} className="aspect-square w-full rounded-md bg-neutral-bg object-cover" />
                </a>
              </li>
            ))}
          </ul>
        )}
        {!closed && (
          <label className="inline-flex h-12 w-fit cursor-pointer items-center gap-2 rounded-md border border-border-input bg-bg px-4 font-semibold aria-disabled:opacity-50" aria-disabled={uploading}>
            <Camera className="size-5" aria-hidden />{uploading ? "Enviando…" : "Tirar foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }}
            />
          </label>
        )}
      </Card>

      {canWork && !closed && started && (
        <Card className="p-4">
          {signature ? (
            <p className="mb-3 text-sm text-muted">Assinada por {signature.name} em {signature.at}. Assine de novo para substituir.</p>
          ) : null}
          <SignatureField label={`Assinatura do técnico${requireSignature ? " *" : ""}`} onChange={onSig} />
        </Card>
      )}

      {signature && (closed || !canWork) && (
        <Card className="flex flex-col gap-2 p-4">
          <p className="text-sm font-medium">Assinatura do técnico</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- link assinado temporário do Storage */}
          <img src={signature.url} alt={`Assinatura de ${signature.name}`} className="h-28 w-full rounded-md border border-border object-contain" />
          <p className="text-xs font-normal text-muted">{signature.name} · {signature.at}</p>
        </Card>
      )}

      {error && <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">{error}</p>}

      {canWork && !closed && (
        <div className="flex flex-col gap-2">
          {!started && (
            <Button size="lg" block loading={pending} onClick={() => change("in_progress", "Atendimento iniciado")}>
              <Play aria-hidden />Iniciar atendimento
            </Button>
          )}
          {started && (
            <>
              <Button size="lg" block loading={pending} onClick={finish}>
                <CheckCircle2 aria-hidden />Concluir OS
              </Button>
              {wo.status === "in_progress" ? (
                <Button size="lg" variant="secondary" block disabled={pending} onClick={() => change("waiting_material", "OS aguardando material")}>
                  <PackageSearch aria-hidden />Aguardando material
                </Button>
              ) : (
                <Button size="lg" variant="secondary" block disabled={pending} onClick={() => change("in_progress", "Atendimento retomado")}>
                  <Play aria-hidden />Retomar atendimento
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

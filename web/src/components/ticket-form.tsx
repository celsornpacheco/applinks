"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Factory, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { PRIORITY } from "@/lib/domain";
import { openTicket } from "@/lib/actions/work-orders";
import { uploadEvidence } from "@/lib/uploads";

type Props = {
  me: { id: string };
  assets: { id: string; label: string; area: string }[];
  categories: { id: string; name: string }[];
  presetAssetId?: string;
  origin: "qr" | "app" | "web";
  // para onde ir depois de abrir (o app do celular ou o detalhe no desktop)
  detailBase?: string;
};

export function TicketForm({ me, assets, categories, presetAssetId, origin, detailBase = "/app/os" }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const preset = assets.find((a) => a.id === presetAssetId);

  function addPhoto(files: FileList | null) {
    if (!files) return;
    setPhotos((p) => [...p, ...[...files].map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 6));
  }

  function submit(form: FormData) {
    setError(undefined);
    start(async () => {
      const res = await openTicket(form);
      if (res.error || !res.id) return setError(res.error ?? "Não foi possível abrir o chamado.");
      // chamado já existe; foto que falhar não desfaz o chamado, só avisa
      let failed = 0;
      for (const p of photos) {
        try {
          await uploadEvidence(res.id, p.file, { uploadedBy: me.id });
        } catch {
          failed++;
        }
      }
      if (failed) toast.error(`${failed} foto(s) não foram enviadas. Você pode anexar de novo na OS.`);
      else toast.success("Chamado aberto. A manutenção foi avisada.");
      router.push(`${detailBase}/${res.id}`);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="origin" value={origin} />
      {error && <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">{error}</p>}

      <Card className="flex flex-col gap-4 p-4">
        {preset ? (
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-neutral-bg p-2 text-neutral-fg"><Factory className="size-5" aria-hidden /></div>
            <div>
              <p className="text-base font-semibold">{preset.label}</p>
              <p className="text-sm font-normal text-muted">{preset.area}</p>
            </div>
            <input type="hidden" name="asset_id" value={preset.id} />
          </div>
        ) : (
          <Field label="Equipamento" required>
            {({ id }) => (
              <Select id={id} name="asset_id" defaultValue="" className="h-12">
                <option value="" disabled>Escolha a máquina</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </Select>
            )}
          </Field>
        )}

        <Field label="O que aconteceu?" required hint="Em poucas palavras. Ex.: vazamento de óleo no cilindro">
          {({ id, describedBy }) => <Input id={id} name="title" maxLength={120} aria-describedby={describedBy} className="h-12" />}
        </Field>
        <Field label="Detalhes">
          {({ id }) => <Textarea id={id} name="description" maxLength={2000} placeholder="Desde quando, barulho, cheiro, o que já foi tentado…" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prioridade">
            {({ id }) => (
              <Select id={id} name="priority" defaultValue="medium" className="h-12">
                {Object.entries(PRIORITY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Tipo">
            {({ id }) => (
              <Select id={id} name="category_id" defaultValue="" className="h-12">
                <option value="">Não sei</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </Field>
        </div>
        <label className="flex min-h-12 items-center gap-3 rounded-md border border-border-input px-3">
          <input type="checkbox" name="machine_stopped" className="size-5 accent-[var(--danger)]" />
          <span className="text-base">A máquina está parada</span>
        </label>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium">Fotos ({photos.length}/6)</p>
        {photos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
                <img src={p.url} alt={`Foto ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((list) => list.filter((x) => x !== p))}
                  className="absolute top-1 right-1 rounded-pill bg-fg/70 p-1 text-bg"
                  aria-label={`Remover foto ${i + 1}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length < 6 && (
          <label className="inline-flex h-12 w-fit cursor-pointer items-center gap-2 rounded-md border border-border-input bg-bg px-4 font-semibold">
            <Camera className="size-5" aria-hidden />Tirar foto
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { addPhoto(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </Card>

      <Button type="submit" size="lg" block loading={pending}>Enviar chamado</Button>
    </form>
  );
}

"use client";

import { useId } from "react";
import { Camera, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChecklistKind } from "@/lib/domain";
import { Input, Textarea } from "@/components/ui/field";

export type ChecklistItemSpec = {
  id: string;
  label: string;
  kind: ChecklistKind;
  required?: boolean;
  critical?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
};

export type AnswerValue = string | number | boolean | null;

type Props = {
  item: ChecklistItemSpec;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onPhoto?: (file: File) => void;
  photoCount?: number;
  missing?: boolean; // tentou concluir sem responder
};

export function outOfRange(item: ChecklistItemSpec, value: AnswerValue) {
  if (item.kind !== "reading" || typeof value !== "number") return false;
  return (item.min != null && value < item.min) || (item.max != null && value > item.max);
}

// Um item do checklist no app do técnico. Alvos de toque de 48px, um item por cartão.
export function ChecklistItem({ item, value, onChange, onPhoto, photoCount = 0, missing }: Props) {
  const id = useId();
  const off = outOfRange(item, value);
  const range =
    item.kind === "reading" && (item.min != null || item.max != null)
      ? `Faixa: ${item.min ?? "—"} a ${item.max ?? "—"} ${item.unit ?? ""}`.trim()
      : undefined;

  return (
    <fieldset
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-surface-raised p-4",
        missing ? "border-danger" : off ? "border-high-fg" : "border-border",
      )}
      aria-invalid={missing || undefined}
    >
      <legend className="sr-only">{item.label}</legend>
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="text-base font-medium">
          {item.label}
          {(item.required || item.critical) && <span className="text-danger" aria-hidden> *</span>}
        </label>
        {item.critical && (
          <span className="shrink-0 rounded-pill bg-urgent-bg px-2 py-0.5 text-xs text-urgent-fg">Crítico</span>
        )}
      </div>

      {item.kind === "text" && (
        <Textarea id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || null)} />
      )}

      {(item.kind === "number" || item.kind === "reading") && (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            inputMode="decimal"
            className="h-12 max-w-40 text-lg tabular-nums"
            value={value == null ? "" : String(value)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(",", "."));
              onChange(e.target.value === "" || Number.isNaN(n) ? null : n);
            }}
            aria-describedby={range ? `${id}-range` : undefined}
          />
          {item.unit && <span className="text-muted">{item.unit}</span>}
        </div>
      )}

      {item.kind === "yes_no" && (
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby={id}>
          {[
            [true, "Sim"],
            [false, "Não"],
          ].map(([v, label]) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={value === v}
              onClick={() => onChange(v as boolean)}
              className={cn(
                "h-12 rounded-md border text-base font-semibold",
                value === v ? "border-accent bg-accent text-on-accent" : "border-border-input bg-bg text-fg",
              )}
            >
              {label as string}
            </button>
          ))}
        </div>
      )}

      {item.kind === "choice" && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={id}>
          {item.options?.map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={value === opt}
              onClick={() => onChange(opt)}
              className={cn(
                "h-12 rounded-md border px-4 text-base",
                value === opt ? "border-accent bg-accent text-on-accent" : "border-border-input bg-bg text-fg",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(item.kind === "photo" || onPhoto) && (
        <label className="inline-flex h-12 w-fit cursor-pointer items-center gap-2 rounded-md border border-border-input bg-bg px-4 font-semibold">
          <Camera className="size-5" aria-hidden />
          {photoCount > 0 ? `${photoCount} foto(s) · adicionar` : "Tirar foto"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPhoto?.(f);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {range && (
        <p id={`${id}-range`} className={cn("flex items-center gap-1.5 text-sm", off ? "text-high-fg" : "text-muted")}>
          {off && <TriangleAlert className="size-4" aria-hidden />}
          {off ? `Fora da faixa. ${range}` : range}
        </p>
      )}
      {missing && <p className="text-sm text-danger">Obrigatório para concluir a OS.</p>}
    </fieldset>
  );
}

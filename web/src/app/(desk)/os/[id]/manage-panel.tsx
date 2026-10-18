"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { assignTechnician, cancelWorkOrder, removeTechnician, setStatus } from "@/lib/actions/work-orders";
import type { ActionResult } from "@/lib/actions/errors";
import type { WorkOrderStatus } from "@/lib/domain";

type Person = { id: string; full_name: string };

export function ManagePanel({ wo, assigned, technicians }: { wo: { id: string; number: number; status: WorkOrderStatus }; assigned: Person[]; technicians: Person[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pick, setPick] = useState("");
  const [reason, setReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const closed = wo.status === "done" || wo.status === "cancelled";
  const available = technicians.filter((t) => !assigned.some((a) => a.id === t.id));

  const run = (fn: () => Promise<ActionResult>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.error) return void toast.error(res.error);
      toast.success(ok);
      after?.();
      router.refresh();
    });

  return (
    <Card>
      <CardHeader title="Atendimento" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">Técnicos</p>
          {assigned.length ? (
            <ul className="flex flex-col gap-1">
              {assigned.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  {t.full_name}
                  {!closed && (
                    <button
                      onClick={() => run(() => removeTechnician(wo.id, t.id), "Técnico removido")}
                      className="rounded-md p-1 text-muted hover:bg-neutral-bg"
                      aria-label={`Remover ${t.full_name}`}
                      disabled={pending}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Ninguém atribuído.</p>
          )}
        </div>

        {!closed && (
          <div className="flex items-end gap-2">
            <Field label="Atribuir técnico" className="flex-1">
              {({ id }) => (
                <Select id={id} value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">{available.length ? "Escolha" : "Todos já atribuídos"}</option>
                  {available.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </Select>
              )}
            </Field>
            <Button
              variant="secondary"
              size="icon"
              className="h-11"
              disabled={!pick || pending}
              aria-label="Atribuir"
              onClick={() => run(() => assignTechnician(wo.id, pick), "Técnico atribuído. Ele foi avisado.", () => setPick(""))}
            >
              <UserPlus aria-hidden />
            </Button>
          </div>
        )}

        {!closed && (
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="justify-start text-danger">Cancelar OS…</Button>
            </DialogTrigger>
            <DialogContent title={`Cancelar a OS #${wo.number}?`} description="O motivo fica registrado no histórico.">
              <div className="flex flex-col gap-4">
                <Field label="Motivo" required>
                  {({ id }) => <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}
                </Field>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild><Button variant="ghost">Voltar</Button></DialogClose>
                  <Button
                    variant="danger"
                    loading={pending}
                    disabled={!reason.trim()}
                    onClick={() => run(() => cancelWorkOrder(wo.id, reason), "OS cancelada", () => setCancelOpen(false))}
                  >
                    Cancelar OS
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {wo.status === "cancelled" && (
          <Button variant="secondary" loading={pending} onClick={() => run(() => setStatus(wo.id, "open"), "OS reaberta")}>
            Reabrir OS
          </Button>
        )}
      </div>
    </Card>
  );
}

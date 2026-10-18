// Valores e rótulos do domínio. Os valores batem com os checks de replica/schema.sql.

export const WORK_ORDER_STATUS = {
  open: "Aberta",
  assigned: "Atribuída",
  in_progress: "Em andamento",
  waiting_material: "Aguardando material",
  done: "Concluída",
  cancelled: "Cancelada",
} as const;
export type WorkOrderStatus = keyof typeof WORK_ORDER_STATUS;

export const PRIORITY = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
} as const;
export type Priority = keyof typeof PRIORITY;

export const CRITICALITY = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
} as const;
export type Criticality = keyof typeof CRITICALITY;

export const WORK_ORDER_KIND = {
  preventive: "Preventiva",
  corrective: "Corretiva",
} as const;
export type WorkOrderKind = keyof typeof WORK_ORDER_KIND;

export const ROLE = {
  admin: "Administrador",
  manager: "Gestor",
  technician: "Técnico",
  requester: "Solicitante",
} as const;
export type Role = keyof typeof ROLE;

export const CHECKLIST_KIND = {
  text: "Texto",
  number: "Número",
  reading: "Leitura",
  photo: "Foto",
  choice: "Seleção",
  yes_no: "Sim / Não",
} as const;
export type ChecklistKind = keyof typeof CHECKLIST_KIND;

export type SlaState = "ok" | "risk" | "breached";
export const SLA_STATE: Record<SlaState, string> = {
  ok: "No prazo",
  risk: "Em risco",
  breached: "Estourado",
};

-- Cadastro inicial da Inovapet Embalagens. Pode rodar mais de uma vez (não duplica).
-- Setores, sistemas e prazos são um ponto de partida: ajuste em Configurações.

insert into sites (name, city, state) values ('Fábrica 1', null, null)
on conflict (name) do nothing;

insert into areas (site_id, name)
select s.id, a.name
from sites s, (values ('Injeção'), ('Sopro'), ('Extrusão'), ('Utilidades'), ('Ferramentaria'), ('Expedição')) as a(name)
where s.name = 'Fábrica 1'
  and not exists (select 1 from areas x where x.site_id = s.id and x.name = a.name and x.parent_id is null);

insert into systems (name) values
  ('Hidráulico'), ('Pneumático'), ('Elétrico'), ('Refrigeração'), ('Moldes'), ('Mecânico'), ('Automação')
on conflict (name) do nothing;

insert into categories (name) values
  ('Mecânica'), ('Elétrica'), ('Hidráulica / vazamento'), ('Pneumática'), ('Molde'), ('Segurança'), ('Outros')
on conflict (name) do nothing;

-- Prazos padrão por prioridade (minutos): resposta / solução
insert into sla_rules (category_id, priority, response_minutes, resolution_minutes) values
  (null, 'urgent', 15, 240),
  (null, 'high', 60, 480),
  (null, 'medium', 240, 1440),
  (null, 'low', 1440, 4320)
on conflict do nothing;

-- Segurança não espera: prazo de urgente mesmo quando aberto como alta
insert into sla_rules (category_id, priority, response_minutes, resolution_minutes)
select c.id, 'high', 15, 240 from categories c where c.name = 'Segurança'
on conflict do nothing;

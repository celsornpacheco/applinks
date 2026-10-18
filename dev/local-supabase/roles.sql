-- Papéis e permissões padrão de um projeto Supabase, para o ambiente local de testes.
-- O schema do app (replica/schema.sql) parte destes grants, como no Supabase de verdade.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password 'postgres';
grant anon, authenticated, service_role to authenticator;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
-- como no Supabase: o serviço de login usa um usuário próprio cujo search_path é o schema auth
create role supabase_auth_admin login superuser;
alter role supabase_auth_admin set search_path = auth;
create schema if not exists auth authorization supabase_auth_admin;

grant usage on schema public, extensions, auth to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

alter database postgres set search_path = "$user", public, extensions;

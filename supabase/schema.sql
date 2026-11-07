-- FERRATO — A Guerra dos Despertos
-- Save na nuvem por conta (Supabase Auth + PostgREST).
--
-- Rode este SQL uma vez no Supabase:
--   Dashboard > SQL Editor > New query > cole tudo > Run
--
-- A chave publishable/anon usada pelo jogo é pública. Quem protege os saves
-- é o RLS abaixo: cada usuário autenticado só enxerga a própria linha.

create table if not exists public.game_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save_data jsonb not null,
  client_updated_at bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

-- Anônimos não acessam a tabela; apenas usuários autenticados.
revoke all on table public.game_saves from anon;
grant select, insert, update, delete on table public.game_saves to authenticated;

-- Política única cobre select, insert, update e delete.
drop policy if exists "own save only" on public.game_saves;
create policy "own save only"
  on public.game_saves
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Índice opcional para ordenação futura por atualização.
create index if not exists game_saves_updated_at_idx
  on public.game_saves (updated_at desc);

-- Observação: o upsert do jogo usa on_conflict=user_id, então a PK acima
-- é obrigatória. O campo client_updated_at guarda o relógio do aparelho e
-- permite comparar saves entre iPhone e PC.

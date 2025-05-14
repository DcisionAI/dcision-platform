# Persistence Layer Design

## Core Tables

### `sessions`
Tracks each user's session in the model builder.

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  description text,
  problem_type text,
  status text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

alter table sessions enable row level security;

create policy "Users can access their own sessions"
  on sessions
  for all
  using (user_id = auth.uid());
```

---

### `prompts`
Stores each prompt entered by the user.

```sql
create table prompts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid not null,
  prompt_text text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table prompts enable row level security;

create policy "Users can access their own prompts"
  on prompts
  for all
  using (user_id = auth.uid());
```

---

### `responses`
Stores each LLM response.

```sql
create table responses (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id) on delete cascade,
  user_id uuid not null,
  response_text text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table responses enable row level security;

create policy "Users can access their own responses"
  on responses
  for all
  using (user_id = auth.uid());
```

---

### `steps`
Stores each step/action the user takes in the builder.

```sql
create table steps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid not null,
  step_type text not null,
  step_data jsonb,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table steps enable row level security;

create policy "Users can access their own steps"
  on steps
  for all
  using (user_id = auth.uid());
```

---

## Analytics Table for Dashboard Metrics

To efficiently power dashboard cards (e.g., total prompts, responses, decisions), we use an `analytics` table that is updated in real-time via Postgres triggers. This table stores per-user aggregate metrics and is kept up-to-date as users interact with the system.

### Table Schema

```sql
create table analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  total_sessions integer default 0,
  total_prompts integer default 0,
  total_responses integer default 0,
  total_decisions integer default 0,
  updated_at timestamp with time zone default timezone('utc', now())
);

alter table analytics enable row level security;

create policy "Users can access their own analytics"
  on analytics
  for all
  using (user_id = auth.uid());
```

### Upsert Helper Function
Ensures an analytics row exists for each user:

```sql
create or replace function ensure_analytics_row(user_id uuid)
returns void as $$
begin
  insert into analytics (user_id)
  values (user_id)
  on conflict (user_id) do nothing;
end;
$$ language plpgsql;
```

### Triggers for Real-Time Metrics

#### Sessions Table
```sql
create or replace function increment_total_sessions()
returns trigger as $$
begin
  perform ensure_analytics_row(NEW.user_id);
  update analytics
    set total_sessions = total_sessions + 1,
        updated_at = timezone('utc', now())
    where user_id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_increment_total_sessions
after insert on sessions
for each row execute procedure increment_total_sessions();
```

#### Prompts Table
```sql
create or replace function increment_total_prompts()
returns trigger as $$
begin
  perform ensure_analytics_row(NEW.user_id);
  update analytics
    set total_prompts = total_prompts + 1,
        updated_at = timezone('utc', now())
    where user_id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_increment_total_prompts
after insert on prompts
for each row execute procedure increment_total_prompts();
```

#### Responses Table
```sql
create or replace function increment_total_responses()
returns trigger as $$
begin
  perform ensure_analytics_row(NEW.user_id);
  update analytics
    set total_responses = total_responses + 1,
        updated_at = timezone('utc', now())
    where user_id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_increment_total_responses
after insert on responses
for each row execute procedure increment_total_responses();
```

#### Decisions via Steps Table (model_deploy step)
```sql
create or replace function increment_total_decisions_from_steps()
returns trigger as $$
begin
  if NEW.step_type = 'model_deploy' then
    perform ensure_analytics_row(NEW.user_id);
    update analytics
      set total_decisions = total_decisions + 1,
          updated_at = timezone('utc', now())
      where user_id = NEW.user_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_increment_total_decisions_from_steps
after insert on steps
for each row execute procedure increment_total_decisions_from_steps();
```

---

## Design Notes
- The `analytics` table is updated in real-time using triggers on the `sessions`, `prompts`, `responses`, and `steps` tables.
- A "decision" is defined as a `steps` row with `step_type = 'model_deploy'`.
- The upsert helper ensures each user has an analytics row before incrementing metrics.
- This design is extensible: add more columns and triggers for new metrics as needed.
- All analytics are per-user; for global stats, aggregate across all users.

---

## Extending the Analytics Layer
- To add new metrics, add columns to the `analytics` table and update or add new triggers.
- For more complex or global metrics, consider scheduled jobs or materialized views.
- For dashboard queries, simply select the relevant row from `analytics` for the current user. 
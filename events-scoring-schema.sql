-- ====================
-- EVENTS AND SCORING SCHEMA
-- ====================

-- ====================
-- TABLE: Events
-- ====================
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  max_participants integer,
  current_participants integer default 0,
  status text default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_by uuid not null, -- faculty_id, sbo_officer_id, or admin_id
  created_by_type text not null check (created_by_type in ('faculty', 'sbo_officer', 'admin')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ====================
-- TABLE: Event Participants
-- ====================
create table if not exists event_participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  tribe_id uuid references tribes(id) on delete set null,
  registration_date timestamp default now(),
  attendance_status text default 'registered' check (attendance_status in ('registered', 'attended', 'absent', 'late')),
  points_earned integer default 0,
  created_at timestamp default now(),
  unique(event_id, student_id)
);

-- ====================
-- TABLE: Tribe Scores
-- ====================
create table if not exists tribe_scores (
  id uuid primary key default uuid_generate_v4(),
  tribe_id uuid references tribes(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  total_participants integer default 0,
  total_points integer default 0,
  average_score decimal(5,2) default 0,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(tribe_id, event_id)
);

-- ====================
-- TABLE: Tribe Score History
-- ====================
create table if not exists tribe_score_history (
  id uuid primary key default uuid_generate_v4(),
  tribe_id uuid references tribes(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  points_change integer not null,
  reason text,
  recorded_by uuid not null, -- faculty_id, sbo_officer_id, or admin_id
  recorded_by_type text not null check (recorded_by_type in ('faculty', 'sbo_officer', 'admin')),
  created_at timestamp default now()
);

-- ====================
-- ENABLE RLS
-- ====================
alter table events enable row level security;
alter table event_participants enable row level security;
alter table tribe_scores enable row level security;
alter table tribe_score_history enable row level security;

-- ====================
-- RLS POLICIES FOR EVENTS
-- ====================

-- Everyone can view events
create policy "Everyone can view events"
on events for select
using (true);

-- Faculty, SBO, and Admins can create events
create policy "Staff can create events"
on events for insert
with check (
  (created_by_type = 'faculty' and exists (
    select 1 from faculty where faculty.id = created_by and faculty.email = auth.jwt() ->> 'email'
  )) or
  (created_by_type = 'sbo_officer' and exists (
    select 1 from sbo_officers where sbo_officers.id = created_by and sbo_officers.email = auth.jwt() ->> 'email'
  )) or
  (created_by_type = 'admin' and exists (
    select 1 from admins where admins.id = created_by and admins.email = auth.jwt() ->> 'email'
  ))
);

-- Staff can update events they created
create policy "Staff can update their events"
on events for update
using (
  (created_by_type = 'faculty' and exists (
    select 1 from faculty where faculty.id = created_by and faculty.email = auth.jwt() ->> 'email'
  )) or
  (created_by_type = 'sbo_officer' and exists (
    select 1 from sbo_officers where sbo_officers.id = created_by and sbo_officers.email = auth.jwt() ->> 'email'
  )) or
  (created_by_type = 'admin' and exists (
    select 1 from admins where admins.id = created_by and admins.email = auth.jwt() ->> 'email'
  ))
);

-- Staff can delete events they created
create policy "Staff can delete their events"
on events for delete
using (
  (created_by_type = 'faculty' and exists (
    select 1 from faculty where faculty.id = created_by and faculty.email = auth.jwt() ->> 'email'
  )) or
  (created_by_type = 'sbo_officer' and exists (
    select 1 from sbo_officers where sbo_officers.id = created_by and sbo_officers.email = auth.jwt() ->> 'email'
  )) or
  (created_by_type = 'admin' and exists (
    select 1 from admins where admins.id = created_by and admins.email = auth.jwt() ->> 'email'
  ))
);

-- ====================
-- RLS POLICIES FOR EVENT PARTICIPANTS
-- ====================

-- Everyone can view event participants
create policy "Everyone can view event participants"
on event_participants for select
using (true);

-- Students can register for events
create policy "Students can register for events"
on event_participants for insert
with check (student_id = auth.uid()::uuid);

-- Students can update their own participation
create policy "Students can update their participation"
on event_participants for update
using (student_id = auth.uid()::uuid);

-- Staff can update any participation (for attendance tracking)
create policy "Staff can update participation"
on event_participants for update
using (
  exists (
    select 1 from faculty where faculty.email = auth.jwt() ->> 'email'
  ) or
  exists (
    select 1 from sbo_officers where sbo_officers.email = auth.jwt() ->> 'email'
  ) or
  exists (
    select 1 from admins where admins.email = auth.jwt() ->> 'email'
  )
);

-- ====================
-- RLS POLICIES FOR TRIBE SCORES
-- ====================

-- Everyone can view tribe scores
create policy "Everyone can view tribe scores"
on tribe_scores for select
using (true);

-- Staff can manage tribe scores
create policy "Staff can manage tribe scores"
on tribe_scores for all
using (
  exists (
    select 1 from faculty where faculty.email = auth.jwt() ->> 'email'
  ) or
  exists (
    select 1 from sbo_officers where sbo_officers.email = auth.jwt() ->> 'email'
  ) or
  exists (
    select 1 from admins where admins.email = auth.jwt() ->> 'email'
  )
);

-- ====================
-- RLS POLICIES FOR TRIBE SCORE HISTORY
-- ====================

-- Everyone can view tribe score history
create policy "Everyone can view tribe score history"
on tribe_score_history for select
using (true);

-- Staff can add score history
create policy "Staff can add score history"
on tribe_score_history for insert
with check (
  (recorded_by_type = 'faculty' and exists (
    select 1 from faculty where faculty.id = recorded_by and faculty.email = auth.jwt() ->> 'email'
  )) or
  (recorded_by_type = 'sbo_officer' and exists (
    select 1 from sbo_officers where sbo_officers.id = recorded_by and sbo_officers.email = auth.jwt() ->> 'email'
  )) or
  (recorded_by_type = 'admin' and exists (
    select 1 from admins where admins.id = recorded_by and admins.email = auth.jwt() ->> 'email'
  ))
);

-- ====================
-- FUNCTIONS AND TRIGGERS
-- ====================

-- Function to update tribe scores when event participants change
create or replace function update_tribe_scores()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    -- Update or insert tribe score for the event
    insert into tribe_scores (tribe_id, event_id, total_participants, total_points, average_score)
    values (new.tribe_id, new.event_id, 1, new.points_earned, new.points_earned)
    on conflict (tribe_id, event_id) do update set
      total_participants = tribe_scores.total_participants + 1,
      total_points = tribe_scores.total_points + new.points_earned,
      average_score = (tribe_scores.total_points + new.points_earned) / (tribe_scores.total_participants + 1),
      updated_at = now();
  elsif tg_op = 'UPDATE' then
    -- Update tribe score when points change
    update tribe_scores set
      total_points = total_points - old.points_earned + new.points_earned,
      average_score = (total_points - old.points_earned + new.points_earned) / total_participants,
      updated_at = now()
    where tribe_id = new.tribe_id and event_id = new.event_id;
  elsif tg_op = 'DELETE' then
    -- Update tribe score when participant is removed
    update tribe_scores set
      total_participants = total_participants - 1,
      total_points = total_points - old.points_earned,
      average_score = case 
        when total_participants - 1 = 0 then 0
        else (total_points - old.points_earned) / (total_participants - 1)
      end,
      updated_at = now()
    where tribe_id = old.tribe_id and event_id = old.event_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

-- Trigger to automatically update tribe scores
create trigger update_tribe_scores_trigger
  after insert or update or delete on event_participants
  for each row
  execute function update_tribe_scores();

-- Function to update event participant count
create or replace function update_event_participant_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update events set current_participants = current_participants + 1 where id = new.event_id;
  elsif tg_op = 'DELETE' then
    update events set current_participants = current_participants - 1 where id = old.event_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

-- Trigger to automatically update event participant count
create trigger update_event_participant_count_trigger
  after insert or delete on event_participants
  for each row
  execute function update_event_participant_count(); 
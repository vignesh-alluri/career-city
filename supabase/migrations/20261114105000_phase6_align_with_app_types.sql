-- employment_type: required and limited to the values the app offers (was optional free text)
alter table public.applications drop constraint if exists applications_employment_type_check;
alter table public.applications alter column employment_type set default 'internship';
alter table public.applications alter column employment_type set not null;
alter table public.applications add constraint applications_employment_type_check
  check (employment_type in ('internship','placement','part_time','full_time','other'));

-- notes: the form allows 5000 characters, so the database must too (was 4000)
alter table public.applications drop constraint if exists applications_notes_check;
alter table public.applications add constraint applications_notes_check
  check (notes is null or char_length(notes) <= 5000);

-- job_description: form allows 5000; keep the database at the same limit so they cannot drift
alter table public.applications drop constraint if exists applications_job_description_check;
alter table public.applications add constraint applications_job_description_check
  check (job_description is null or char_length(job_description) <= 5000);

-- reminder title: form allows 120
alter table public.reminders drop constraint if exists reminders_title_check;
alter table public.reminders add constraint reminders_title_check
  check (char_length(btrim(title)) between 1 and 120);

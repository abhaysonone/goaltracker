-- Three cases, checked in priority order:
-- 1. raw_app_meta_data.invited_company_id: set only by the admin-create-employee
--    edge function via the service_role Admin API. A public signUp() call can
--    NEVER set app_metadata (only user_metadata), so this can't be forged by a
--    self-registering user to jump into an arbitrary company.
-- 2. raw_user_meta_data.company_name: founding admin, registers a brand new
--    company for their own (email-domain-derived, not manually typed) domain.
-- 3. otherwise: regular employee, must join an already-registered company whose
--    domain matches their email — rejected if none exists.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_company_name text;
  v_invited_company_id uuid;
  v_email_domain text;
  v_company_id uuid;
begin
  v_name := coalesce(new.raw_user_meta_data->>'name', new.email);
  v_company_name := nullif(trim(new.raw_user_meta_data->>'company_name'), '');
  v_invited_company_id := nullif(new.raw_app_meta_data->>'invited_company_id', '')::uuid;
  v_email_domain := lower(split_part(new.email, '@', 2));

  if v_invited_company_id is not null then
    if not exists (select 1 from public.companies where id = v_invited_company_id) then
      raise exception 'invited_company_id % does not exist', v_invited_company_id;
    end if;
    insert into public.profiles (id, name, email, company_id)
    values (new.id, v_name, new.email, v_invited_company_id);

  elsif v_company_name is not null then
    begin
      insert into public.companies (name, domain)
      values (v_company_name, v_email_domain)
      returning id into v_company_id;
    exception when unique_violation then
      raise exception 'A company is already registered for domain %. Sign up without a company name to join it.', v_email_domain;
    end;

    insert into public.profiles (id, name, email, role, company_id)
    values (new.id, v_name, new.email, 'admin', v_company_id);

    update public.companies set created_by = new.id where id = v_company_id;

  else
    select id into v_company_id from public.companies where domain = v_email_domain;
    if v_company_id is null then
      raise exception 'No company is registered for domain %. Ask your admin to sign up and set up the company first.', v_email_domain;
    end if;

    insert into public.profiles (id, name, email, company_id)
    values (new.id, v_name, new.email, v_company_id);
  end if;

  return new;
end;
$$;

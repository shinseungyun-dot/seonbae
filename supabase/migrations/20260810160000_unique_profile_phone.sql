-- A normalized phone number can belong to only one portal account.
create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone)
  where phone is not null;

notify pgrst, 'reload schema';

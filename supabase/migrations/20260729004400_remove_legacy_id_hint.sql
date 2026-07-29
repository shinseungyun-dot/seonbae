-- Removes the legacy masked-ID lookup after SMTP recovery is available.
drop function if exists public.find_account_hint(text, text);

notify pgrst, 'reload schema';

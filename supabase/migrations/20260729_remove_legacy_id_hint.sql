revoke all on function public.find_account_hint(text, text) from public;
revoke all on function public.find_account_hint(text, text) from anon;
revoke all on function public.find_account_hint(text, text) from authenticated;
drop function if exists public.find_account_hint(text, text);

notify pgrst, 'reload schema';

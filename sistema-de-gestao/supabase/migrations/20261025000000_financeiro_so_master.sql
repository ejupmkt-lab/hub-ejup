-- O financeiro é só do gestor master (Roberto Pivotto): ninguém libera o
-- acesso pelo sistema. A permissão fica em perfis.ve_financeiro e só muda
-- direto no banco.
revoke execute on function public.definir_financeiro(text, boolean) from authenticated;

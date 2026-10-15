// Mensagens do Supabase (em inglês) traduzidas para quem usa o sistema
const traducoes: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/auth session missing|session.*expired|jwt expired/i, "Sua sessão expirou. Entre de novo pelo login ou abra o link do e-mail outra vez."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/password should be at least|password is too short/i, "A senha precisa ter pelo menos 8 caracteres."],
  [/user already registered|already been registered/i, "Este e-mail já tem conta. Use “Entrar” ou “Esqueci a senha”."],
  [/email not confirmed/i, "Confirme o e-mail pelo link que enviamos antes de entrar."],
  [/for security purposes|rate limit|too many requests/i, "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."],
  [/invalid totp|invalid code|code.*expired/i, "Código incorreto ou expirado. Confira o aplicativo e tente de novo."],
  [/failed to fetch|network/i, "Sem conexão com o servidor. Confira a internet e tente de novo."],
  [/unable to validate email|invalid email/i, "E-mail inválido."],
  [/aal2|assurance level/i, "Confirme o código da verificação em duas etapas para fazer isso."],
];

export function traduzirErro(e: unknown, padrao = "Não foi possível concluir. Tente de novo.") {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e ?? "");
  if (!msg) return padrao;
  const t = traducoes.find(([re]) => re.test(msg));
  if (t) return t[1];
  // Mensagens já em português (das nossas funções no banco) passam como estão
  return /[ãçéêíóôõú]|\b(não|você|informe|acesso)\b/i.test(msg) ? msg : padrao;
}

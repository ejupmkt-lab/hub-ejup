// Chaves do Supabase: a antiga service_role é um JWT e vai também no Authorization;
// a nova chave secreta (sb_secret_...) não é JWT e vai só no cabeçalho apikey.
export const authHeader = (key) => (String(key).startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {});

// Converte o campo "video" da aula no que o player do Portal precisa.
// Aceita link do YouTube, Vimeo, Panda Video, arquivo (.mp4/.webm/.m3u8) ou caminho no Storage do Supabase.

export function parseVideo(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return { tipo: 'storage', path: s.replace(/^\/+/, '') };
  let u;
  try { u = new URL(s); } catch { return null; }
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const id = host === 'youtu.be' ? u.pathname.slice(1)
      : u.searchParams.get('v') || (u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/) || [])[1];
    if (!id) return null;
    return { tipo: 'iframe', provedor: 'youtube', url: `https://www.youtube-nocookie.com/embed/${id.split(/[?&/]/)[0]}?rel=0&modestbranding=1` };
  }
  if (host.endsWith('vimeo.com')) {
    const m = u.pathname.match(/(?:video\/)?(\d+)(?:\/(\w+))?/);
    if (!m) return null;
    const h = u.searchParams.get('h') || m[2];
    return { tipo: 'iframe', provedor: 'vimeo', url: `https://player.vimeo.com/video/${m[1]}${h ? `?h=${h}` : ''}` };
  }
  if (host.includes('pandavideo')) return { tipo: 'iframe', provedor: 'panda', url: s };
  if (/\.(mp4|webm|m3u8|mov)(\?|$)/i.test(u.pathname + u.search)) return { tipo: 'arquivo', url: s };
  return { tipo: 'iframe', provedor: 'outro', url: s };
}

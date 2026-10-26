/* EJUP plataforma — sidebar. Globals: window.AppSidebar */
function AppSidebar({ active = "Painel", onNav }) {
  const items = [
    ["Painel", "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"],
    ["Meus cursos", "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z"],
    ["Cronograma", "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"],
    ["Biblioteca", "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"],
    ["Certificados", "M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12"],
  ];
  return (
    <aside style={{ width: 248, background: "var(--ejup-navy)", color: "#fff", height: "100%", display: "flex", flexDirection: "column", padding: "28px 16px", flexShrink: 0 }}>
      <img src="../../assets/logo/ejup-horizontal-white.svg" alt="ejup — Educação Jurídica" style={{ height: 32, alignSelf: "flex-start", marginLeft: 8, marginBottom: 36 }} />
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map(([label, d]) => {
          const on = active === label;
          return (
            <button key={label} onClick={() => onNav && onNav(label)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
              background: on ? "rgba(240,184,85,0.14)" : "transparent", border: "none",
              borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "left",
              color: on ? "var(--ejup-gold)" : "rgba(255,255,255,0.78)",
              fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: on ? 700 : 400,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
              {label}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", background: "var(--ejup-steel)", borderRadius: "var(--radius-md)", padding: 16 }}>
        <div style={{ fontSize: 12, color: "var(--ejup-gold)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Progresso geral</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>64%</div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: "64%", height: "100%", background: "var(--ejup-gold)" }} />
        </div>
      </div>
    </aside>
  );
}
Object.assign(window, { AppSidebar });

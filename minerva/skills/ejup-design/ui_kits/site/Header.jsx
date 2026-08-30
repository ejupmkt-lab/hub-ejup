/* EJUP marketing site — header. Globals: window.SiteHeader */
function SiteHeader({ onNav, active = "Cursos" }) {
  const { Button } = window.EJUPDesignSystem_063f43;
  const links = ["Cursos", "Professores", "Institucional", "Blog"];
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", height: 76, background: "var(--ejup-navy)",
      borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 10,
    }}>
      <img src="../../assets/logo/ejup-horizontal-white.svg" alt="ejup — Educação Jurídica" style={{ height: 36 }} />
      <nav style={{ display: "flex", gap: 36 }}>
        {links.map((l) => (
          <button key={l} onClick={() => onNav && onNav(l)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: active === l ? 700 : 400,
            letterSpacing: "0.02em", color: active === l ? "var(--ejup-gold)" : "rgba(255,255,255,0.82)",
            padding: "6px 0",
          }}>{l}</button>
        ))}
      </nav>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Button variant="ghost" size="sm" style={{ color: "#fff" }}>Entrar</Button>
        <Button variant="gold" size="sm">Matricule-se</Button>
      </div>
    </header>
  );
}
Object.assign(window, { SiteHeader });

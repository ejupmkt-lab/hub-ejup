/* EJUP marketing site — professors + footer. Globals: window.SiteProfessors, window.SiteFooter */
function SiteProfessors() {
  const { Eyebrow, Avatar } = window.EJUPDesignSystem_063f43;
  const profs = [
    { name: "Helena Vasconcelos", role: "Direito Constitucional", note: "Doutora · 22 anos de tribunal" },
    { name: "Rafael Andrade", role: "Tributário", note: "Mestre · ex-procurador" },
    { name: "Beatriz Lemos", role: "Processo Civil", note: "Doutora · autora de referência" },
    { name: "Gustavo Pinheiro", role: "Penal", note: "Mestre · advocacia criminal" },
  ];
  return (
    <section style={{ background: "var(--ejup-navy)", color: "#fff", padding: "84px 48px" }}>
      <Eyebrow>Corpo docente</Eyebrow>
      <h2 style={{ fontSize: 40, fontWeight: 900, margin: "12px 0 8px", letterSpacing: "-0.02em" }}>Notório saber, em pessoa</h2>
      <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.7)", maxWidth: 540, margin: "0 0 44px" }}>
        Experts consagrados que honram a tradição e exercem liderança no presente.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {profs.map((p) => (
          <div key={p.name} style={{ background: "var(--ejup-steel)", borderRadius: "var(--radius-md)", padding: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
            <Avatar name={p.name} size={56} style={{ background: "var(--ejup-navy)" }} />
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 16 }}>{p.name}</div>
            <div style={{ fontSize: 13, color: "var(--ejup-gold)", marginTop: 4, letterSpacing: "0.02em" }}>{p.role}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{p.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  const cols = [
    ["Programas", ["OAB", "Pós-graduação", "Carreiras", "Cursos livres"]],
    ["Institucional", ["Quem somos", "Manifesto", "Professores", "Trabalhe conosco"]],
    ["Suporte", ["Central de ajuda", "Contato", "Termos", "Privacidade"]],
  ];
  return (
    <footer style={{ background: "var(--ejup-ink)", color: "rgba(255,255,255,0.7)", padding: "64px 48px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 280 }}>
          <img src="../../assets/logo/ejup-horizontal-white.svg" alt="ejup — Educação Jurídica" style={{ height: 34 }} />
          <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 18 }}>Transformar o notório saber jurídico em educação digital de alto nível.</p>
        </div>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ejup-gold)", marginBottom: 16 }}>{h}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((i) => <li key={i} style={{ fontSize: 14 }}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 48, paddingTop: 24, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
        © 2026 EJUP — Escola Jurídica. Autoridade silenciosa.
      </div>
    </footer>
  );
}
Object.assign(window, { SiteProfessors, SiteFooter });

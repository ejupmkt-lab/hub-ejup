/* EJUP marketing site — hero. Globals: window.SiteHero */
function SiteHero() {
  const { Button, Eyebrow } = window.EJUPDesignSystem_063f43;
  return (
    <section style={{
      position: "relative", background: "linear-gradient(160deg, #031c37 0%, #0d131a 100%)",
      color: "#fff", padding: "96px 48px 104px", overflow: "hidden",
    }}>
      <div style={{ maxWidth: 760 }}>
        <Eyebrow>Escola Jurídica · Educação de excelência</Eyebrow>
        <h1 style={{
          fontSize: 64, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.02em",
          margin: "20px 0 0",
        }}>Alma clássica,<br />repertório contemporâneo.</h1>
        <p style={{
          fontSize: 19, fontWeight: 300, lineHeight: 1.55, color: "rgba(255,255,255,0.78)",
          maxWidth: 560, margin: "26px 0 0",
        }}>
          Formação jurídica profunda para o jurista da profundidade consciente. Tradição reinterpretada
          para a era digital — sem perda de densidade, rigor ou legitimidade.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 38 }}>
          <Button variant="gold" size="lg">Conheça os programas</Button>
          <Button variant="secondary" size="lg" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>Fale com a coordenação</Button>
        </div>
        <div style={{ display: "flex", gap: 48, marginTop: 64 }}>
          {[["+120", "horas de conteúdo denso"], ["38", "professores de referência"], ["9.4", "satisfação dos alunos"]].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: 38, fontWeight: 900, color: "var(--ejup-gold)", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 8, maxWidth: 150 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <img aria-hidden="true" src="../../assets/logo/ejup-symbol-gold.svg" alt="" style={{
        position: "absolute", right: -110, top: "50%", transform: "translateY(-50%)",
        height: 620, width: "auto", opacity: 0.10, pointerEvents: "none",
      }} />
    </section>
  );
}
Object.assign(window, { SiteHero });

/* EJUP plataforma — dashboard. Globals: window.AppDashboard */
function AppDashboard({ onOpenLesson }) {
  const { Card, Eyebrow, Badge, Button, Avatar } = window.EJUPDesignSystem_063f43;
  const courses = [
    { title: "Direito Constitucional Aplicado", prof: "Helena Vasconcelos", pct: 72, next: "Controle de constitucionalidade", area: "OAB · 2ª Fase" },
    { title: "Planejamento Tributário", prof: "Rafael Andrade", pct: 40, next: "Elisão e evasão fiscal", area: "Pós" },
    { title: "Preparação Magistratura", prof: "Beatriz Lemos", pct: 18, next: "Teoria geral do processo", area: "Carreira" },
  ];
  return (
    <div style={{ flex: 1, overflow: "auto", background: "var(--surface-muted)" }}>
      {/* topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 36px", background: "#fff", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ position: "relative", width: 360 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: "absolute", left: 12, top: 11 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input placeholder="Buscar aulas, materiais, professores…" style={{ width: "100%", padding: "9px 14px 9px 36px", fontFamily: "var(--font-sans)", fontSize: 14, border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", outline: "none" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Badge variant="gold">7 dias de revisão</Badge>
          <Avatar name="João Pereira" size={38} />
        </div>
      </div>

      <div style={{ padding: 36 }}>
        <Eyebrow tone="navy">Bom dia, João</Eyebrow>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-heading)", margin: "10px 0 28px", letterSpacing: "-0.02em" }}>Continue de onde parou</h1>

        {/* continue card */}
        <Card tone="dark" elevation="md" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 32px", marginBottom: 32 }}>
          <div>
            <Eyebrow tone="onDark">Aula em andamento</Eyebrow>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "10px 0 6px" }}>Controle de constitucionalidade</h2>
            <div style={{ fontSize: 14, color: "var(--text-on-dark-muted)" }}>Direito Constitucional · Módulo 04 · 18 min restantes</div>
          </div>
          <Button variant="gold" size="lg" onClick={() => onOpenLesson && onOpenLesson()}>Retomar aula</Button>
        </Card>

        <Eyebrow tone="muted">Seus cursos</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 16 }}>
          {courses.map((c) => (
            <Card key={c.title} tone="light" elevation="sm" interactive onClick={() => onOpenLesson && onOpenLesson()}>
              <Eyebrow tone="muted" style={{ fontSize: 11 }}>{c.area}</Eyebrow>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-heading)", margin: "10px 0 14px", lineHeight: 1.25 }}>{c.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Avatar name={c.prof} size={28} />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.prof}</span>
              </div>
              <div style={{ height: 6, background: "var(--surface-muted)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: c.pct + "%", height: "100%", background: "var(--ejup-gold)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                <span>{c.pct}% concluído</span>
                <span>Próx.: {c.next}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { AppDashboard });

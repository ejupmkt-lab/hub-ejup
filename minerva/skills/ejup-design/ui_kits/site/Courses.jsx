/* EJUP marketing site — courses section. Globals: window.SiteCourses */
function SiteCourses({ onOpen }) {
  const { Card, Eyebrow, Badge, Button } = window.EJUPDesignSystem_063f43;
  const courses = [
    { area: "OAB · 2ª Fase", title: "Direito Constitucional Aplicado", desc: "Fundamentos, jurisprudência e peças, com profundidade doutrinária.", h: "48h", badge: "Novo", bv: "gold" },
    { area: "Pós · Tributário", title: "Planejamento Tributário Estratégico", desc: "Da norma à prática, integrando tecnologia ao raciocínio jurídico.", h: "72h", badge: "Turma 04", bv: "navy" },
    { area: "Carreira · Magistratura", title: "Preparação para a Magistratura", desc: "Percurso cumulativo e estruturado para concursos de alto nível.", h: "120h", badge: "Online", bv: "neutral" },
  ];
  return (
    <section style={{ background: "var(--surface-muted)", padding: "84px 48px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <Eyebrow tone="navy">Programas</Eyebrow>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: "var(--text-heading)", margin: "12px 0 0", letterSpacing: "-0.02em" }}>
            Um percurso, não um atalho
          </h2>
        </div>
        <Button variant="secondary">Ver todos os cursos</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {courses.map((c) => (
          <Card key={c.title} tone="light" elevation="sm" interactive onClick={() => onOpen && onOpen(c)} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <Eyebrow tone="muted" style={{ fontSize: 11 }}>{c.area}</Eyebrow>
              <Badge variant={c.bv}>{c.badge}</Badge>
            </div>
            <h3 style={{ fontSize: 21, fontWeight: 700, color: "var(--text-heading)", margin: "0 0 10px", lineHeight: 1.2 }}>{c.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 24px", flex: 1 }}>{c.desc}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.h} · certificado</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ejup-navy)" }}>Ver programa →</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
Object.assign(window, { SiteCourses });

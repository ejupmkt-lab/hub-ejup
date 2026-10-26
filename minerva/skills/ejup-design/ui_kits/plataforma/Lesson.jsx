/* EJUP plataforma — lesson player. Globals: window.AppLesson */
function AppLesson({ onBack }) {
  const { Eyebrow, Badge, Button, Tabs, Avatar } = window.EJUPDesignSystem_063f43;
  const [tab, setTab] = React.useState("Conteúdo");
  const lessons = [
    ["01", "Origens do controle de constitucionalidade", "12 min", true],
    ["02", "Sistemas difuso e concentrado", "18 min", true],
    ["03", "Controle de constitucionalidade", "24 min", "now"],
    ["04", "Efeitos da decisão", "16 min", false],
    ["05", "Jurisprudência aplicada do STF", "28 min", false],
  ];
  return (
    <div style={{ flex: 1, overflow: "auto", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 36px", borderBottom: "1px solid var(--border-subtle)" }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", width: 36, height: 36, cursor: "pointer", color: "var(--ejup-navy)" }}>←</button>
        <div>
          <Eyebrow tone="muted" style={{ fontSize: 11 }}>Direito Constitucional · Módulo 04</Eyebrow>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-heading)", marginTop: 2 }}>Controle de constitucionalidade</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 0 }}>
        <div style={{ padding: 36 }}>
          {/* player */}
          <div style={{ position: "relative", aspectRatio: "16/9", background: "linear-gradient(160deg,#031c37,#0d131a)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--ejup-gold)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-gold)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--ejup-navy)"><polygon points="6 4 20 12 6 20 6 4" /></svg>
            </div>
            <img src="../../assets/logo/ejup-symbol-white.svg" alt="" style={{ position: "absolute", top: 18, left: 22, height: 34, opacity: 0.55 }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 5, background: "rgba(255,255,255,0.18)" }}>
              <div style={{ width: "32%", height: "100%", background: "var(--ejup-gold)" }} />
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <Tabs tabs={["Conteúdo", "Materiais", "Anotações"]} value={tab} onChange={setTab} />
            <div style={{ paddingTop: 22 }}>
              {tab === "Conteúdo" && (
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-heading)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>O que você vai estudar</h2>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-body)", maxWidth: 620 }}>
                    Nesta aula, percorremos o controle de constitucionalidade com a profundidade que o tema exige — da
                    construção histórica à jurisprudência contemporânea do STF. A proposta não é o atalho, mas o percurso:
                    tradição reinterpretada para a prática atual.
                  </p>
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <Badge variant="navy">Constitucional</Badge>
                    <Badge variant="neutral">Jurisprudência</Badge>
                    <Badge variant="gold">Essencial</Badge>
                  </div>
                </div>
              )}
              {tab === "Materiais" && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {["Apostila — Controle de constitucionalidade.pdf", "Súmulas vinculantes selecionadas.pdf", "Mapa mental do módulo.png"].map((m) => (
                    <li key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 14, color: "var(--text-body)" }}>
                      {m}<Button variant="ghost" size="sm">Baixar</Button>
                    </li>
                  ))}
                </ul>
              )}
              {tab === "Anotações" && (
                <textarea placeholder="Escreva suas anotações…" style={{ width: "100%", minHeight: 160, padding: 16, fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.6, border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", outline: "none", resize: "vertical" }} />
              )}
            </div>
          </div>
        </div>

        {/* lesson list */}
        <div style={{ borderLeft: "1px solid var(--border-subtle)", padding: "28px 24px", background: "var(--surface-muted)" }}>
          <Eyebrow tone="navy">Módulo 04 · 5 aulas</Eyebrow>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            {lessons.map(([n, t, dur, st]) => (
              <div key={n} style={{ display: "flex", gap: 12, padding: "12px 12px", borderRadius: "var(--radius-sm)", background: st === "now" ? "#fff" : "transparent", border: st === "now" ? "1px solid var(--border-strong)" : "1px solid transparent", cursor: "pointer" }}>
                <span style={{ fontWeight: 900, fontSize: 13, color: st === "now" ? "var(--ejup-gold)" : "var(--text-muted)" }}>
                  {st === true ? "✓" : n}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: st === "now" ? 700 : 500, color: st ? "var(--text-heading)" : "var(--text-muted)", lineHeight: 1.35 }}>{t}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{dur}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { AppLesson });

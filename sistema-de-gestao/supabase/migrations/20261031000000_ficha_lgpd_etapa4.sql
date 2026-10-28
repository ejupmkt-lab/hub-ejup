-- Ficha 13070-5 (Adequação à LGPD), Etapa 04: o objetivo cita a "listagem de documentos elaborados", mas faltavam os
-- entregáveis correspondentes. Passam a constar os do Relatório 4 aprovado: "Listagem de documentos relevantes do programa"
-- e "Fortalecimento da governança", com a atividade de checklist de cada um. Projetos em andamento mantêm a cópia que já
-- têm (as etapas são copiadas na criação do projeto); só os novos nascem com os dois entregáveis.
update public.servicos
set dados = jsonb_set(
      jsonb_set(
        dados,
        '{etapas}',
        (
          select jsonb_agg(
            case when (e ->> 'ordem')::int = 4 then
              jsonb_set(
                jsonb_set(e, '{entregaveis}', (e -> 'entregaveis') || '["Listagem de documentos relevantes do programa","Fortalecimento da governança"]'::jsonb),
                '{atividades}',
                (e -> 'atividades') || '[["3.2","Elaborar a listagem de documentos relevantes do programa: políticas, normas, procedimentos, RoPA, fluxo de atendimento aos titulares, política de backup, central de incidentes e planos de treinamento e de comunicação"],["4","Fortalecer a governança do programa"],["4.1","Definir e documentar os papéis, os responsáveis, as evidências e as rotinas de governança do programa"]]'::jsonb
              )
            else e end
            order by ord
          )
          from jsonb_array_elements(dados -> 'etapas') with ordinality as t (e, ord)
        )
      ),
      '{versao}',
      to_jsonb(coalesce((dados ->> 'versao')::int, 1) + 1)
    ),
    updated_at = now()
where id = 'lgpd-sebrae-13070-5'
  and dados::text not like '%Listagem de documentos relevantes do programa%';

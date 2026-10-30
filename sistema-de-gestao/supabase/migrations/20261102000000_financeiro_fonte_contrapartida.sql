-- Fonte de custeio da contrapartida do projeto: de quem saiu o dinheiro e, portanto, para onde ele tem que voltar
-- ("roberto", "leonardo", "caixa" ou "outra"; vazio = não definida). Segue a regra da linha: só quem vê o financeiro lê e grava.
alter table public.financeiro_projetos add column fonte_contrapartida text;

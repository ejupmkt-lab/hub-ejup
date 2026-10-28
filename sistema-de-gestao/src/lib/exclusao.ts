// Confirmação de exclusão: a pessoa digita a palavra por inteiro (sem diferenciar maiúsculas) para liberar o botão.
export const PALAVRA_DE_EXCLUSAO = "EXCLUIR";
export const confirmouExclusao = (digitado: string) => digitado.trim().toUpperCase() === PALAVRA_DE_EXCLUSAO;

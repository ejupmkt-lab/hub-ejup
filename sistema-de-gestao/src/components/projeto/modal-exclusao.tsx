"use client";

import { useEffect, useRef, useState } from "react";
import { Botao, Campo } from "@/components/ui";
import { confirmouExclusao, PALAVRA_DE_EXCLUSAO } from "@/lib/exclusao";

// Confirmação de exclusão sem window.prompt (que não funciona em navegadores embutidos): a pessoa digita EXCLUIR para
// liberar o botão. A palavra precisa bater por inteiro (sem diferenciar maiúsculas) e o botão fica desligado até lá.
export function ModalExclusao({
  titulo,
  aviso,
  excluindo,
  aoConfirmar,
  aoCancelar,
}: {
  titulo: string;
  aviso: string;
  excluindo: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}) {
  const [digitado, setDigitado] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => campo.current?.focus(), []);
  const liberado = confirmouExclusao(digitado);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-tinta/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onKeyDown={(e) => e.key === "Escape" && !excluindo && aoCancelar()}
    >
      <form
        className="max-h-[90vh] w-full max-w-md space-y-4 overflow-auto rounded-[var(--radius-bloco)] bg-folha p-5 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (liberado && !excluindo) aoConfirmar();
        }}
      >
        <div>
          <h2 className="text-lg font-bold text-vermelho">{titulo}</h2>
          <p className="mt-1 text-[14px] text-tinta-2">{aviso}</p>
        </div>
        <Campo rotulo={`Para confirmar, digite ${PALAVRA_DE_EXCLUSAO}`}>
          <input
            ref={campo}
            className="campo"
            autoComplete="off"
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            disabled={excluindo}
            aria-label={`Digite ${PALAVRA_DE_EXCLUSAO} para confirmar`}
          />
        </Campo>
        <div className="flex flex-wrap justify-end gap-2">
          <Botao type="button" variante="secundario" onClick={aoCancelar} disabled={excluindo}>
            Cancelar
          </Botao>
          <Botao type="submit" variante="perigo" disabled={!liberado || excluindo}>
            {excluindo ? "Excluindo…" : "Excluir definitivamente"}
          </Botao>
        </div>
      </form>
    </div>
  );
}

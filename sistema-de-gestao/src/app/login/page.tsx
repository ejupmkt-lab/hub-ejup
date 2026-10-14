import { Suspense } from "react";
import { FormLogin } from "./form-login";

type Props = { searchParams: Promise<{ erro?: string }> };

async function Conteudo({ searchParams }: Props) {
  const { erro } = await searchParams;
  return <FormLogin erroLink={erro === "link"} />;
}

export default function Login({ searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

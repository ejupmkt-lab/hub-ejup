import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./tipos-banco";

let cliente: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function supabaseNavegador() {
  cliente ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return cliente;
}

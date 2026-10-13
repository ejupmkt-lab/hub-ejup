import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ProvedorEstado } from "@/lib/prototipo/store";
import { Shell } from "@/components/shell";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HUB Pivotto",
  description: "Gestão das empresas do ecossistema Pivotto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} antialiased`}>
        <ProvedorEstado>
          <Shell>{children}</Shell>
        </ProvedorEstado>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triaje Manta | Asistente clínico",
  description: "Orientación clínica con fuentes verificables."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}

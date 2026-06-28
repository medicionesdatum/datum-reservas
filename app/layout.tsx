import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DATUM Mediciones | Reservas",
  description: "Cotiza y reserva mediciones láser 3D, planos 2D y modelos Revit."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

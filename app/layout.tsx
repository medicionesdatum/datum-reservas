import type { Metadata } from "next";
import { absoluteUrl, site } from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "DATUM Mediciones | Reservas de medición láser 3D",
    template: "%s | DATUM Mediciones"
  },
  description: site.description,
  alternates: {
    canonical: absoluteUrl("/"),
    types: {
      "text/plain": [
        {
          title: "llms.txt",
          url: absoluteUrl("/llms.txt")
        }
      ]
    }
  },
  openGraph: {
    title: "DATUM Mediciones | Reservas de medición láser 3D",
    description: site.description,
    url: site.url,
    siteName: site.name,
    images: [
      {
        url: "/assets/datum-hero.jpg",
        width: 2000,
        height: 857,
        alt: "Escaneado láser 3D y nube de puntos de DATUM Mediciones"
      }
    ],
    locale: "es_ES",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // Tarjeta digital: página estática autocontenida en public/tarjeta.html, servida en /tarjeta.
    return [{ source: "/tarjeta", destination: "/tarjeta.html" }];
  },
  async headers() {
    return [
      {
        // Sin este tipo, el iPhone no abre la ficha de contacto al descargarla.
        source: "/daniel-escobar.vcf",
        headers: [{ key: "Content-Type", value: "text/vcard; charset=utf-8" }]
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;

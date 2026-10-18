import type { MetadataRoute } from "next";

// O que o celular usa ao "instalar" o site como app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inovapet Manutenção",
    short_name: "Manutenção",
    description: "Ordens de serviço, chamados e preventivas da Inovapet Embalagens",
    lang: "pt-BR",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6f8",
    theme_color: "#1b2430",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

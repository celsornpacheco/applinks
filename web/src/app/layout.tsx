import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { RegisterServiceWorker } from "@/components/pwa";

export const metadata: Metadata = {
  title: { default: "Inovapet Manutenção", template: "%s · Inovapet Manutenção" },
  description: "Controle de manutenção de ativos e equipamentos da Inovapet Embalagens",
  appleWebApp: { capable: true, title: "Manutenção", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#1b2430",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <Toaster />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}

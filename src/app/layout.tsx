import type { Metadata } from "next";
import "./globals.css";

import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "InselGlossar – Glossar des Inselspitals Bern",
  description: "Das Fachbegriffe-Glossar des Inselspitals Bern. Beitragen, lernen & Wissen testen.",
  keywords: "Inselspital, Glossar, Medizin, Bern, Fachbegriffe, Krankenhaus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

import type React from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import dynamic from "next/dynamic";
// @ts-ignore - CSS import side effect
import "./globals.css";
import { ThemeProvider } from "next-themes";

const poppins = Poppins({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Portfolio - Personal Website",
  description: "Personal portfolio website showcasing projects and skills",
};

// ClientLayout dimuat secara dinamis dengan SSR dinonaktifkan
// Ini penting karena ClientLayout menggunakan hooks yang hanya berjalan di sisi klien
const ClientLayout = dynamic(() => import("@/components/ClientLayout"), {
  ssr: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {/* Semua konten aplikasi dibungkus oleh ClientLayout */}
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

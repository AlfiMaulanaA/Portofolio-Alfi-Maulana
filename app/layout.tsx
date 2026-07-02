import type React from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
// @ts-ignore - CSS import side effect
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const poppins = Poppins({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Alfi Maulana Al-Farisi | IoT Engineer & Software Developer",
  description:
    "Portfolio of Alfi Maulana Al-Farisi, focused on IoT systems, industrial automation, and full-stack software development.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DryWise Dashboard",
  description: "ราวตากผ้าหมุนหนีฝน — live sensor dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={noto.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

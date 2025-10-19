import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aithen AI Chat",
  description: "Chat with Aithen AI - Your intelligent assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
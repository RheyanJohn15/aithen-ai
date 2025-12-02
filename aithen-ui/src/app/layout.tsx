import type { Metadata } from "next";
import { Exo_2, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "sonner";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-exo-2",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aithens AI",
  description: "Chat with Aithens AI - Your intelligent assistant",
  icons: {
    icon: [
      { url: '/logo/nobg/logo-light.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo/nobg/logo-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/logo/nobg/logo-light.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`antialiased h-full ${inter.variable} ${exo2.variable} font-body`}>
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-right"
            expand={true}
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-gray-800 group-[.toaster]:border-gray-200 group-[.toaster]:dark:border-gray-700',
                description: 'group-[.toast]:text-gray-600 group-[.toast]:dark:text-gray-400',
                actionButton: 'group-[.toast]:bg-[var(--color-aithen-teal)] group-[.toast]:text-white',
                cancelButton: 'group-[.toast]:bg-gray-100 group-[.toast]:dark:bg-gray-700',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
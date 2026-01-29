import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { NotificationProvider } from "../contexts/NotificationContext";
import { ToastProvider } from "../contexts/ToastContext";
import ToastContainer from "../components/ToastContainer";
import SessionMonitor from "../components/SessionMonitor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeamService Costa - Sistema Administrativo",
  description: "Sistema administrativo para TeamService Costa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultTheme="light"
          storageKey="teamservice-theme"
        >
          <ToastProvider>
            <NotificationProvider>
              <SessionMonitor />
              {children}
              <ToastContainer />
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

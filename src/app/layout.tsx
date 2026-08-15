import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tejus Auditorium — Booking & Availability",
  description: "Official real-time booking availability calendar and enquiry portal for Tejus Auditorium.",
  keywords: ["Tejus Auditorium", "Auditorium Booking", "Hall Booking", "Kerala", "Wedding Hall", "Conference Hall"],
  authors: [{ name: "Tejus Auditorium" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden max-w-full">
      <body className="antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden max-w-full min-h-screen">
        <div className="min-h-screen flex flex-col justify-between overflow-x-hidden max-w-full">
          <main className="flex-1 overflow-x-hidden max-w-full">{children}</main>
          <footer className="no-print py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/40">
            © {new Date().getFullYear()} Tejus Auditorium. All rights reserved. • Booking Enquiries:{" "}
            <a href="tel:9447241559" className="font-medium text-slate-600 hover:text-blue-600 underline">
              9447241559
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}

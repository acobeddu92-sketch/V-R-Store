import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'V_R Store — Lengkap Kebutuhan Anda, Praktis Pelayanannya!',
  description: 'Toko serba ada penyedia ATK, fotocopy, print, perlengkapan sekolah, aksesoris, parfum, dan agen BRILink resmi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

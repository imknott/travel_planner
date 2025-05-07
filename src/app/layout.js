import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/navbar';
import Footer from "@/components/footer";
import { LanguageProvider } from '@/context/LanguageContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "flighthacked.com – Find the cheapest flight combinations",
  description: "Flight hacking made easy. Search for the cheapest custom layover routes with flighthacked.com",
  icons: [],
  other: {
    'preload-images': [
      '/images/europe.jpg',
      '/images/asia.jpg',
      '/images/southAmerica.jpg',
      '/images/global.jpg',
      '/images/spring.jpg',
      '/images/summer.jpg',
      '/images/fall.jpg',
      '/images/winter.jpg',
      '/images/adventure.jpg',
      '/images/chill.jpg',
      '/images/city.jpg',
      '/images/cultural.jpg',
      '/images/remote_nature.jpg'
    ]
      .map(url => `<link rel="preload" as="image" href="${url}" />`)
      .join('\n')
  }
};

export default function RootLayout({ children,params }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white`}>
      <LanguageProvider lang={params.locale}>
          <Navbar />
          <main className="pt-10 px-4 min-h-screen">
            <Toaster position="top-right" />
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}

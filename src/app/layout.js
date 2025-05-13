import { LanguageProvider } from '@/context/LanguageContext';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Toaster } from 'react-hot-toast';
import "@/app/globals.css";

export default function LocaleLayout({ children, params }) {
  const { locale } = params;

  return (
    <html lang={locale} className="dark">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
        <LanguageProvider lang={locale}>
          <Navbar />
          <main className="pt-10 px-4 min-h-screen">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}

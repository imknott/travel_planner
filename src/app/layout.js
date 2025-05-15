import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Toaster } from 'react-hot-toast';
import "@/app/globals.css";

export default function LocaleLayout({ children }) {

  return (
    <html lang='en' className="dark">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
          <Navbar />
          <main className="pt-10 px-4 min-h-screen">
            {children}
          </main>
          <Footer />
      </body>
    </html>
  );
}

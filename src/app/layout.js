// app/layout.js or app/LocaleLayout.jsx

import ClientLayout from '@/components/ClientOnlyLayout';
import Footer from '@/components/footer';
import '@/app/globals.css';

export default function LocaleLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
        <ClientLayout>
          <main className="pt-10 px-4 min-h-screen">{children}</main>
          <Footer />
        </ClientLayout>
      </body>
    </html>
  );
}

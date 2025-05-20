import ClientOnlyLayout from '@/components/ClientOnlyLayout';
import dynamic from 'next/dynamic';
import Footer from '@/components/footer';
import '@/app/globals.css';

const Navbar = dynamic(() => import('@/components/navbar'), { ssr: false });
export default function LocaleLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_PLACES_KEY}&libraries=places`}
        async
        defer
      ></script>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
        <ClientOnlyLayout>
          <Navbar />
          <main className="pt-10 px-4 min-h-screen">{children}</main>
          <Footer />
        </ClientOnlyLayout>
      </body>
    </html>
  );
}

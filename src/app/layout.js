// app/layout.js

import ClientOnlyLayout from '@/components/ClientOnlyLayout';
import Footer from '@/components/footer';
import '@/app/globals.css';

// ✅ Final layout.js structure
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientOnlyLayout>
          {children}
        </ClientOnlyLayout>
        <Footer />
      </body>
    </html>
  );
}

// app/layout.js

import Footer from '@/components/footer';
import '@/app/globals.css';
import NavbarBase from '@/components/NavbarBase';

// ✅ Final layout.js structure
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavbarBase/>
          {children}
       
        <Footer />
      </body>
    </html>
  );
}

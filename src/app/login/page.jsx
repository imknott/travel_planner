// app/login/page.jsx
import dynamic from 'next/dynamic';

const LoginClient = dynamic(() => import('@/components/LoginClient'), {
  ssr: false,
});

export default function LoginPageWrapper() {
  return <LoginClient />;
}

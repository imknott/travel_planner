export const dynamic = 'force-dynamic';


export default function NotFound() {
  return (
    <div className="min-h-screen pt-24 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-gray-500">Sorry, we couldn’t find what you were looking for.</p>
      <a
        href="/"
        className="inline-block mt-6 text-blue-600 hover:underline"
      >
        ← Back to home
      </a>
    </div>
  );
}

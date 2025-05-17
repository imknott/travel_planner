'use client';

export default function AttractionCard({ name, image, description }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm">
          No Image Available
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{description}</p>
      </div>
    </div>
  );
}

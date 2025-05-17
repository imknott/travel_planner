'use client';

export default function FlightCard({ flight, travelers = 1 }) {
  if (!flight) return null;

  const formatDuration = (iso) => {
    if (!iso) return 'N/A';
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const hours = match?.[1] || '0';
    const mins = match?.[2] || '00';
    return `${hours}h ${mins}m`;
  };

  const formatMoney = (amount) =>
    `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  return (
    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-md mb-3">
      <p className="text-sm mb-1">
        <strong>Airline:</strong> {flight.airline || 'Unknown'}
      </p>
      <p className="text-sm mb-1">
        <strong>Duration:</strong> {formatDuration(flight.duration)}
      </p>
      <p className="text-sm mb-1">
        <strong>{flight.stops === 0 ? 'Direct flight' : `${flight.stops} stop(s)`}</strong>
      </p>
      <p className="text-sm">
        <strong>Price:</strong> {formatMoney(flight.price)} × {travelers} traveler{travelers > 1 ? 's' : ''}
      </p>
    </div>
  );
}

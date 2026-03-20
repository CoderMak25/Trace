const stats = [
  { value: '142', label: 'Upcoming', pinColor: 'bg-red', rotate: 'rotate-1 hover:-rotate-1', blob: 'blob-1' },
  { value: '89', label: 'Online', pinColor: 'bg-blue', rotate: '-rotate-2 hover:rotate-1', blob: 'blob-2' },
  { value: '53', label: 'In-Person', pinColor: 'bg-red', rotate: 'rotate-2 hover:-rotate-1', blob: 'blob-1' },
  { value: '24', label: 'This Month', pinColor: 'bg-blue', rotate: '-rotate-1 hover:rotate-2', blob: 'blob-4' },
];

export default function StatsBar() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 -mt-4 mb-16 relative z-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`bg-yellow border-[3px] border-ink p-4 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#2d2d2d] relative ${s.rotate} transition-transform ${s.blob} ${
              i === 3 ? 'hidden md:flex' : ''
            }`}
          >
            {/* Pin */}
            <div className={`pin ${s.pinColor}`} />
            <span className="text-4xl md:text-5xl font-heading tracking-tight text-ink mt-2">{s.value}</span>
            <span className="text-base text-ink/80 uppercase tracking-widest mt-1 border-t-2 border-dashed border-ink/20 w-full text-center pt-1">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

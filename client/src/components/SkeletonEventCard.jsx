export default function SkeletonEventCard({ index = 0 }) {
  const CARD_STYLES = ['blob-1', 'blob-2', 'blob-3'];
  const blobClass = CARD_STYLES[index % 3];

  return (
    <div className={`bg-tan/20 border-[3px] border-ink/10 p-6 flex flex-col gap-4 relative animate-pulse ${blobClass} text-left`}>
      
      {/* Tape / Pin Decoration */}
      {index % 2 === 0 ? (
        <div className="tape w-24 h-7 bg-ink/5 border border-dashed border-ink/10 rotate-2 absolute -top-3 left-1/2 -translate-x-1/2" />
      ) : (
        <div className="pin w-4 h-4 bg-ink/10 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 shadow-inner" />
      )}

      {/* Category + Actions */}
      <div className="flex justify-between items-start pt-2">
        <div className="w-20 h-6 bg-ink/10 rounded border-2 border-ink/5" />
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-ink/10 rounded" />
        </div>
      </div>

      {/* Title + Description */}
      <div className="block mt-1">
        <div className="w-3/4 h-8 bg-ink/10 rounded mb-4" />
        <div className="w-full h-4 bg-ink/10 rounded mb-2" />
        <div className="w-5/6 h-4 bg-ink/10 rounded" />
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-ink/10 rounded shrink-0" />
          <div className="w-1/2 h-4 bg-ink/10 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-ink/10 rounded shrink-0" />
          <div className="w-2/3 h-4 bg-ink/10 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-ink/10 rounded shrink-0" />
          <div className="w-3/4 h-4 bg-ink/10 rounded" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t-[3px] border-dashed border-ink/10 flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <div className="w-16 h-3 bg-ink/10 rounded" />
          <div className="w-24 h-6 bg-ink/10 rounded" />
        </div>
        <div className="w-20 h-8 bg-ink/10 rounded-md border-2 border-ink/5" />
      </div>
    </div>
  );
}

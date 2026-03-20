import { Icon } from '@iconify/react';

export default function FilterBar({ filters, setFilters }) {
  const quickTags = [
    { label: '#Mumbai', color: 'red' },
    { label: '#AI/ML', color: 'blue' },
    { label: '#Fintech', color: 'yellow', active: true },
    { label: '#BeginnerFriendly', color: 'red' },
    { label: '#Web3', color: 'blue' },
    { label: '#Online', color: 'red' },
    { label: '#Delhi', color: 'blue' },
  ];

  function handleTagClick(tag) {
    const value = tag.replace('#', '');
    setFilters((prev) => ({
      ...prev,
      search: prev.search === value ? '' : value,
    }));
  }

  return (
    <section id="events" className="w-full max-w-6xl mx-auto px-6 mb-8 relative z-10">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink text-xl" />
          <input
            type="text"
            placeholder="Search events, organizers, cities..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full bg-white border-[3px] border-ink text-ink text-lg pl-12 pr-4 py-3 shadow-[4px_4px_0_0_#2d2d2d] focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 transition-colors placeholder:text-ink/40 blob-1"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-4">
          <div className="relative min-w-[140px]">
            <select
              value={filters.mode}
              onChange={(e) => setFilters((prev) => ({ ...prev, mode: e.target.value }))}
              className="w-full appearance-none bg-tan border-[3px] border-ink text-ink text-lg pl-4 pr-10 py-3 shadow-[4px_4px_0_0_#2d2d2d] cursor-pointer focus:outline-none focus:border-red blob-2"
            >
              <option value="">Any Mode</option>
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
            </select>
            <Icon icon="solar:alt-arrow-down-linear" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink pointer-events-none text-xl" />
          </div>

          <div className="relative min-w-[150px]">
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full appearance-none bg-tan border-[3px] border-ink text-ink text-lg pl-4 pr-10 py-3 shadow-[4px_4px_0_0_#2d2d2d] cursor-pointer focus:outline-none focus:border-red blob-3"
            >
              <option value="">Category</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Workshop">Workshop</option>
              <option value="Tech Fest">Tech Fest</option>
            </select>
            <Icon icon="solar:alt-arrow-down-linear" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink pointer-events-none text-xl" />
          </div>
        </div>
      </div>

      {/* Quick Tags */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        <span className="text-sm font-heading tracking-tight text-ink/70 whitespace-nowrap mr-2">Quick Tags:</span>
        {quickTags.map((tag, i) => (
          <button
            key={tag.label}
            onClick={() => handleTagClick(tag.label)}
            className={`whitespace-nowrap border-2 px-4 py-1 transition-colors ${
              filters.search === tag.label.replace('#', '')
                ? `bg-${tag.color} text-white border-ink shadow-[2px_2px_0_0_#2d2d2d] ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`
                : `bg-white border-dashed border-ink text-ink hover:bg-${tag.color} hover:text-white hover:border-solid`
            } ${PILL_SHAPES[i % PILL_SHAPES.length]}`}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </section>
  );
}

const PILL_SHAPES = ['blob-2', 'blob-1', 'blob-3', 'blob-2', 'blob-1'];

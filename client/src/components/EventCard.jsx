import { Icon } from '@iconify/react';
import { deadlineLabel, formatDateRange } from '../utils/dateHelpers';
import BookmarkButton from './BookmarkButton';
import { Link } from 'react-router-dom';

const CARD_STYLES = ['blob-1', 'blob-2', 'blob-3'];
const HOVER_ROTATIONS = ['hover:-rotate-1', 'hover:rotate-2', 'hover:-rotate-2'];
const TAG_COLORS = {
  Hackathon: 'bg-tan',
  Workshop: 'bg-yellow',
  'Tech Fest': 'bg-white',
};
const CARD_BGS = ['bg-white', 'bg-white', 'bg-yellow'];

export default function EventCard({ event, index = 0, canEdit = false, onEdit }) {
  const blobClass = CARD_STYLES[index % 3];
  const hoverClass = HOVER_ROTATIONS[index % 3];
  const cardBg = event.category?.includes('Tech Fest') ? 'bg-yellow' : CARD_BGS[index % 3];
  const deadline = deadlineLabel(event.registrationDeadline);
  const mainCategory = event.category?.[0] || 'Event';
  const tagBg = TAG_COLORS[mainCategory] || 'bg-tan';

  return (
    <article
      className={`${cardBg} border-[3px] border-ink p-6 flex flex-col gap-4 shadow-[4px_4px_0_0_#2d2d2d] relative group transition-all duration-200 ${hoverClass} hover:shadow-[8px_8px_0_0_#2d2d2d] hover:-translate-y-1 ${blobClass}`}
    >
      {/* Tape / Pin Decoration */}
      {index % 2 === 0 ? (
        <div className="tape w-24 h-7 bg-tan/80 border border-dashed border-ink/30 rotate-2 backdrop-blur-[2px]" />
      ) : (
        <div className={`pin ${index % 3 === 0 ? 'bg-red' : 'bg-blue'}`} />
      )}

      {/* Category + Actions */}
      <div className="flex justify-between items-start pt-2">
        <span className={`border-2 border-ink px-3 py-1 text-xs ${tagBg} font-heading tracking-tight inline-block ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${CARD_STYLES[(index + 1) % 3]}`}>
          {mainCategory}
        </span>
        <div className="flex gap-2 relative z-10">
          {canEdit && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onEdit) onEdit(event); }}
              className="text-ink/40 hover:text-blue transition-colors p-1"
              title="Edit Event"
            >
              <Icon icon="solar:pen-linear" className="text-xl" />
            </button>
          )}
          <BookmarkButton eventId={event._id} />
        </div>
      </div>

      {/* Title + Description */}
      <Link to={`/event/${event.slug}`} className="block">
        <h3 className="font-heading text-3xl tracking-tight leading-none mb-1 group-hover:text-red transition-colors">
          {event.name}
        </h3>
        {event.teamName && (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-600 border border-purple-300 px-2 py-0.5 rounded-full font-heading mb-2">
            <Icon icon="solar:users-group-rounded-linear" className="text-xs" /> {event.teamName}
          </span>
        )}
        {event.registered && event.selectionStatus && event.selectionStatus !== 'Pending' && (
          <span className={`inline-flex items-center gap-1 text-xs border border-ink px-2 py-0.5 font-heading mb-2 ml-2 shadow-[1px_1px_0_0_#2d2d2d] blob-2 ${event.selectionStatus === 'Selected' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-red/20 text-red'}`}>
            <Icon icon={event.selectionStatus === 'Selected' ? 'solar:verified-check-bold' : 'solar:close-circle-bold'} className="text-xs" />
            {event.selectionStatus}
          </span>
        )}
        <p className="text-base text-ink/80 line-clamp-2">{event.description}</p>
      </Link>

      {/* Details */}
      <div className="flex flex-col gap-2.5 text-base mt-2">
        <div className="flex items-center gap-3">
          <Icon icon="solar:users-group-rounded-linear" className="text-xl text-blue shrink-0" />
          {event.organizer}
        </div>
        <div className="flex items-center gap-3">
          <Icon icon="solar:calendar-linear" className="text-xl text-red shrink-0" />
          {formatDateRange(event.date, event.endDate)}
        </div>
        <div className="flex items-center gap-3">
          <Icon icon="solar:map-point-linear" className="text-xl text-blue shrink-0" />
          {event.city} / {event.mode}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t-[3px] border-dashed border-tan flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-xs text-ink/60 uppercase tracking-wider">
            {event.prizePool && event.prizePool !== 'Free' ? 'Prize Pool' : event.highlights ? 'Highlights' : 'Cost'}
          </span>
          <span className="font-heading text-2xl tracking-tight text-blue">
            {event.prizePool || event.highlights || 'Free'}
          </span>
        </div>
        {deadline && (
          <span className="text-white bg-red border-2 border-ink px-3 py-1 text-sm shadow-[2px_2px_0_0_#2d2d2d] flex items-center gap-1 -rotate-2 blob-3">
            <Icon icon="solar:alarm-linear" /> {deadline}
          </span>
        )}
      </div>
    </article>
  );
}

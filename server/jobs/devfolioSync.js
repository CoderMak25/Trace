const axios = require('axios');
const Event = require('../models/Event');
const slugify = require('../utils/slugify');

const DEVFOLIO_API_URL = 'https://api.devfolio.co/api/hackathons';
const REQUEST_TIMEOUT_MS = 15000;

const http = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json',
  },
});

function calculatePrizePool(prizes) {
  const total = prizes
    ?.filter(p => p.amount && !p.hidden)
    .reduce((sum, p) => sum + parseFloat(p.amount) * (p.quantity || 1), 0);
  return total ? `$${total.toLocaleString()}` : null;
}

function mapDevfolioToEvent(ev) {
  const startsAt = new Date(ev.starts_at);
  const endsAt = new Date(ev.ends_at);
  const durationHours = Math.round((endsAt - startsAt) / (1000 * 60 * 60));

  let mode = 'offline';
  if (ev.hackathon_setting?.is_hybrid) {
    mode = 'hybrid';
  } else if (ev.is_online) {
    mode = 'online';
  }

  return {
    name: ev.name,
    organizer: ev.hackathon_setting?.subdomain || 'Devfolio',
    date: endsAt,
    endDate: endsAt,
    eventStart: startsAt,
    durationHours,
    registrationDeadline: ev.hackathon_setting?.reg_ends_at ? new Date(ev.hackathon_setting.reg_ends_at) : null,
    registrationStart: ev.hackathon_setting?.reg_starts_at ? new Date(ev.hackathon_setting.reg_starts_at) : null,
    mode,
    city: ev.city || '',
    state: ev.state || '',
    category: ev.themes?.map(t => t.name) || [],
    prizePool: calculatePrizePool(ev.prizes),
    registrationLink: ev.hackathon_setting?.subdomain 
      ? `https://${ev.hackathon_setting.subdomain}.devfolio.co` 
      : `https://devfolio.co/hackathons/${ev.slug}`,
    logoUrl: ev.hackathon_setting?.logo || ev.cover_img || '',
    isPaid: ev.hackathon_setting?.paid || false,
    teamSize: {
      min: ev.team_min || 1,
      max: ev.team_size || 4,
    },
    minTeamSize: ev.team_min || 1,
    maxTeamSize: ev.team_size || 4,
    totalRegistrations: ev.participants_count || 0,
    registerCount: ev.participants_count || 0,
    description: ev.tagline || ev.desc || '',
    verified: true,
    source: 'devfolio',
  };
}

async function syncAllDevfolioEvents() {
  console.log('[Devfolio Sync] Starting full sync...');
  const filters = ['application_open', 'live', 'upcoming'];
  let allEvents = [];

  try {
    for (const filter of filters) {
      let page = 1;
      while (true) {
        const response = await http.get(`${DEVFOLIO_API_URL}?page=${page}&per_page=50&filter=${filter}`);
        const events = response.data?.result || [];
        if (events.length === 0) break;
        
        allEvents = [...allEvents, ...events];
        
        if (events.length < 50) break;
        page += 1;
      }
    }

    // Deduplicate by slug
    const seen = new Set();
    const uniqueEvents = allEvents.filter(ev => {
      if (seen.has(ev.slug)) return false;
      seen.add(ev.slug);
      return true;
    });

    let added = 0;
    let updated = 0;

    for (const rawEvent of uniqueEvents) {
      try {
        const mappedEvent = mapDevfolioToEvent(rawEvent);
        // Always use the slug from Devfolio for stability
        mappedEvent.slug = rawEvent.slug;

        await Event.findOneAndUpdate(
          { slug: mappedEvent.slug, source: 'devfolio' },
          { $set: mappedEvent },
          { upsert: true, returnDocument: 'after' }
        );

        updated += 1;
      } catch (err) {
        console.error(`[Devfolio Sync] Failed to upsert event ${rawEvent.slug}:`, err.message);
      }
    }

    console.log(`[Devfolio Sync] Full sync complete | fetched: ${allEvents.length}, unique: ${uniqueEvents.length}, added: ${added}, updated: ${updated}`);
  } catch (err) {
    console.error('[Devfolio Sync] Full sync failed:', err.message);
  }
}

async function updateDevfolioStatuses() {
  console.log('[Devfolio Sync] Starting lightweight status update...');
  try {
    const response = await http.get(`${DEVFOLIO_API_URL}?page=1&per_page=50&filter=application_open`);
    const events = response.data?.result || [];

    for (const ev of events) {
      const subdomain = ev.hackathon_setting?.subdomain;
      const registrationLink = subdomain 
        ? `https://${subdomain}.devfolio.co` 
        : `https://devfolio.co/hackathons/${ev.slug}`;

      try {
        await Event.findOneAndUpdate(
          { slug: ev.slug, source: 'devfolio' },
          {
            $set: {
              registrationDeadline: ev.hackathon_setting?.reg_ends_at ? new Date(ev.hackathon_setting.reg_ends_at) : null,
              totalRegistrations: ev.participants_count || 0,
              registerCount: ev.participants_count || 0,
              minTeamSize: ev.team_min || 1,
              maxTeamSize: ev.team_size || 4,
            },
          },
          { upsert: false }
        );
      } catch (err) {
        console.error(`[Devfolio Sync] Failed to update status for ${ev.slug}:`, err.message);
      }
    }
    console.log(`[Devfolio Sync] Lightweight status update complete | checked: ${events.length}`);
  } catch (err) {
    console.error('[Devfolio Sync] Status update failed:', err.message);
  }
}

module.exports = {
  syncAllDevfolioEvents,
  updateDevfolioStatuses,
};

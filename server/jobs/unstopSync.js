const axios = require('axios');
const Event = require('../models/Event');
const slugify = require('../utils/slugify');

const UNSTOP_URL = 'https://unstop.com/api/public/opportunity/search-result';
const PER_PAGE = 50;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const http = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'User-Agent': 'Mozilla/5.0' },
});

function toDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeMode(region) {
  if (typeof region !== 'string') return 'hybrid';
  const value = region.toLowerCase();
  if (value === 'offline') return 'offline';
  if (value === 'online') return 'online';
  return 'hybrid';
}

function sumPrizeCash(prizes = []) {
  const total = prizes.reduce((sum, prize) => {
    const cash = Number(prize?.cash || 0);
    return sum + (Number.isNaN(cash) ? 0 : cash);
  }, 0);
  return `₹${total.toLocaleString('en-IN')}`;
}

function mapUnstopToEvent(unstopEvent) {
  return {
    name: unstopEvent?.title || 'Untitled Hackathon',
    organizer: unstopEvent?.organisation?.name || 'Unstop',
    date: toDate(unstopEvent?.start_date || unstopEvent?.end_date),
    endDate: toDate(unstopEvent?.end_date),
    registrationDeadline: toDate(unstopEvent?.regnRequirements?.end_regn_dt),
    registrationStart: toDate(unstopEvent?.regnRequirements?.start_regn_dt),
    mode: normalizeMode(unstopEvent?.region),
    city: unstopEvent?.address_with_country_logo?.city || '',
    state: unstopEvent?.address_with_country_logo?.state || '',
    category: Array.isArray(unstopEvent?.workfunction)
      ? unstopEvent.workfunction.map((item) => item?.name).filter(Boolean)
      : [],
    prizePool: sumPrizeCash(unstopEvent?.prizes || []),
    registrationLink: unstopEvent?.seo_url || '',
    logoUrl: unstopEvent?.logoUrl2 || '',
    isPaid: Boolean(unstopEvent?.isPaid),
    registrationFee: Number(unstopEvent?.payment_services?.[0]?.amount || 0),
    fees: Number(unstopEvent?.payment_services?.[0]?.amount || 0),
    teamSize: {
      min: Number(unstopEvent?.regnRequirements?.min_team_size || 1),
      max: Number(unstopEvent?.regnRequirements?.max_team_size || 1),
    },
    minTeamSize: Number(unstopEvent?.regnRequirements?.min_team_size || 1),
    maxTeamSize: Number(unstopEvent?.regnRequirements?.max_team_size || 1),
    totalRegistrations: Number(unstopEvent?.registerCount || 0),
    registerCount: Number(unstopEvent?.registerCount || 0),
    viewsCount: Number(unstopEvent?.viewsCount || 0),
    status: unstopEvent?.status || 'LIVE',
    verified: true,
    source: 'unstop',
  };
}

async function fetchUnstopPage(page, extraParams = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await http.get(UNSTOP_URL, {
        params: {
          opportunity: 'hackathons',
          oppstatus: 'open',
          per_page: PER_PAGE,
          page,
          ...extraParams,
        },
      });
      return response.data?.data?.data || [];
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await delay(400 * attempt);
      }
    }
  }

  throw lastError;
}

async function syncAllUnstopEvents() {
  let page = 1;
  let pagesFetched = 0;
  let totalFetched = 0;
  let added = 0;
  let updated = 0;

  while (true) {
    const events = await fetchUnstopPage(page);
    if (!events.length) break;
    pagesFetched += 1;
    totalFetched += events.length;

    for (const rawEvent of events) {
      try {
        const mappedEvent = mapUnstopToEvent(rawEvent);
        if (!mappedEvent.registrationLink) continue;

        // Skip Devfolio links in Unstop sync to avoid source collisions
        if (mappedEvent.registrationLink.includes('devfolio.co')) {
          continue;
        }

        await Event.findOneAndUpdate(
          { registrationLink: mappedEvent.registrationLink },
          { $set: mappedEvent },
          { upsert: true, returnDocument: 'after' }
        ).lean();

        updated += 1;
      } catch (eventErr) {
        console.error('[Unstop Sync] Event upsert failed:', eventErr.message);
      }
    }

    if (events.length < PER_PAGE) break;
    page += 1;
    await delay(500);
  }

  console.log(
    `[Unstop Sync] Full sync complete | pages: ${pagesFetched}, fetched: ${totalFetched}, added: ${added}, updated: ${updated}`
  );
}

async function updateEventStatuses() {
  const events = await fetchUnstopPage(1, { sortBy: 'latest' });

  for (const rawEvent of events) {
    const registrationLink = rawEvent?.seo_url || '';
    if (!registrationLink) continue;

    try {
      await Event.findOneAndUpdate(
        { registrationLink },
        {
          $set: {
            status: rawEvent?.status || 'LIVE',
            registrationDeadline: toDate(rawEvent?.regnRequirements?.end_regn_dt),
            totalRegistrations: Number(rawEvent?.registerCount || 0),
            registerCount: Number(rawEvent?.registerCount || 0),
            viewsCount: Number(rawEvent?.viewsCount || 0),
          },
        },
        { upsert: false }
      );
    } catch (statusErr) {
      console.error('[Unstop Sync] Status update failed:', statusErr.message);
    }
  }

  console.log(`[Unstop Sync] Lightweight status sync complete | checked: ${events.length}`);
}

module.exports = {
  syncAllUnstopEvents,
  updateEventStatuses,
  syncUnstopEvents: syncAllUnstopEvents,
};

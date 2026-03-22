const axios = require('axios');
const DEVFOLIO_API_URL = 'https://api.devfolio.co/api/hackathons';

async function auditApi() {
  const filters = ['application_open', 'live', 'upcoming'];
  const linkToSlugs = new Map();

  for (const filter of filters) {
    const res = await axios.get(`${DEVFOLIO_API_URL}?page=1&per_page=50&filter=${filter}`);
    const events = res.data?.result || [];
    for (const ev of events) {
      const subdomain = ev.hackathon_setting?.subdomain;
      const link = subdomain ? `https://${subdomain}.devfolio.co` : `https://devfolio.co/hackathons/${ev.slug}`;
      
      if (!linkToSlugs.has(link)) {
        linkToSlugs.set(link, new Set());
      }
      linkToSlugs.get(link).add(ev.slug);
    }
  }

  console.log("--- Audit Results ---");
  let dupes = 0;
  for (const [link, slugs] of linkToSlugs.entries()) {
    if (slugs.size > 1) {
      console.log(`Link collides with slugs: ${[...slugs].join(', ')} -> ${link}`);
      dupes++;
    }
  }
  if (dupes === 0) console.log("No link collisions found in the API results themselves.");
}

auditApi();

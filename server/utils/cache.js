// Shared in-memory cache to ensure cross-module invalidations
const apiCache = new Map();
module.exports = apiCache;

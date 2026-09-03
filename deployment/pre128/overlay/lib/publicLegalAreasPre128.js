'use strict';

const { listPortalSummaries, getPortalBySlug } = require('../data/portals');

function clean(value) {
  return String(value || '')
    .replace(/\b(?:legal\s+)?micro-portal\b/gi, 'focused legal area')
    .replace(/\bportal\b/gi, 'legal area')
    .replace(/\bportals\b/gi, 'legal areas')
    .replace(/cross-legal area/gi, 'cross-area')
    .replace(/source-linked/gi, 'source-backed')
    .replace(/currentness/gi, 'last-checked status')
    .replace(/\s+/g, ' ')
    .trim();
}
function availability(row) {
  const value = `${row.status || ''} ${row.availabilityMessage || ''}`.toLowerCase();
  if (row.publicUrl && /live|available now|start here now/.test(value)) return { state:'available', label:'Available now' };
  if (/safety acceptance|required|closed|not open|paused/.test(value)) return { state:'not-available', label:'Not available yet' };
  if (/development|planned|prepar/.test(value)) return { state:'being-prepared', label:'Being prepared' };
  return { state:'availability-varies', label:'Check availability' };
}
function publicRecord(row) {
  if (!row) return null;
  const status = availability(row);
  const localPath = row.slug === 'general-smarter-justice-start' ? '/' : (row.practices?.[0] ? `/${row.practices[0]}.html` : '/practice-areas.html');
  const external = /^https:\/\//i.test(String(row.publicUrl || ''));
  return {
    id:row.slug,
    slug:row.slug,
    name:clean(row.name),
    status:status.label,
    availabilityState:status.state,
    summary:clean(row.summary),
    audience:clean(row.audience),
    helpsWith:(row.helpsWith || []).map(clean),
    practices:[...(row.practices || [])],
    waysToStart:(row.entryActions || []).map(clean),
    publicUrl:external ? row.publicUrl : localPath,
    externalService:external,
    availabilityMessage:external
      ? `This separate service may be available at its own website. Review that service's current terms and privacy information.`
      : (status.state === 'available' ? 'This Smarter Justice legal area is available now.' : 'Start with Smarter Justice and check the page for current availability.'),
    disclosure:external
      ? 'The linked service is separate from the Smarter Justice legal-community network unless its own page says otherwise.'
      : clean(row.disclosure)
  };
}
function list() { return listPortalSummaries().map(publicRecord); }
function get(slug) { return publicRecord(getPortalBySlug(slug)); }

module.exports = { list, get };

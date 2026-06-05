import { query } from '../src/db/index.js';
import { buildServiceDetailsMapForSetups } from '../src/utils/business-service-categories.js';
import { transformBusinessSetupForListing } from '../src/utils/business-setup-listing.mapper.js';

const id = process.argv[2] || '5e4e12b3-ae98-49b5-b48c-791a18cdc4c6';

const setup = await query('SELECT * FROM business_setups WHERE id = $1', [id]);
if (!setup.rows[0]) {
  console.log('NOT FOUND');
  process.exit(0);
}

const row = setup.rows[0];
console.log('setup meta:', JSON.stringify({
  id: row.id,
  business_name: row.business_name,
  salon_name: row.salon_name,
  is_active: row.is_active,
  location_mode: row.location_mode,
  book_service_combinations: row.book_service_combinations,
  service_for: row.service_for,
}, null, 2));
console.log('service_categories raw:', JSON.stringify(row.service_categories, null, 2));

const team = await query(
  'SELECT id, full_name, assigned_services FROM business_team_members WHERE business_setup_id = $1',
  [id],
);
console.log('team members:', JSON.stringify(team.rows, null, 2));

const teamMembersBySetupId = { [id]: team.rows };
const detailsMap = await buildServiceDetailsMapForSetups([row], query, { teamMembersBySetupId });
console.log('built service details:', JSON.stringify(detailsMap[id] ?? [], null, 2));

const transformed = transformBusinessSetupForListing(row, {
  teamMembers: [],
  serviceDetails: detailsMap[id] ?? [],
});
console.log('transformed serviceDetails:', JSON.stringify(transformed.serviceDetails, null, 2));
console.log('transformed serviceCategories:', JSON.stringify(transformed.serviceCategories, null, 2));

process.exit(0);

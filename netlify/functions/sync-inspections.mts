import { syncInspections } from '../../lib/sync-inspections';

export default async () => {
  try {
    const result = await syncInspections();
    console.log('Inspection sync completed', result);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Inspection sync failed', error);
    return new Response('Inspection sync failed', { status: 500 });
  }
};

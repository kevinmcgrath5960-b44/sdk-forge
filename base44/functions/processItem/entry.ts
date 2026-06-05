import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { item_id } = await req.json();
    if (!item_id) {
      return Response.json({ error: 'item_id is required' }, { status: 400 });
    }

    await base44.entities.Item.update(item_id, {
      status: 'processed',
      processed_at: new Date().toISOString(),
    });

    return Response.json({ message: `Item ${item_id} processed at ${new Date().toISOString()}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
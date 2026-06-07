import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await base44.entities.Item.list('-created_date', 200);

    const statusCounts = { pending: 0, active: 0, done: 0, processed: 0 };
    const categoryCounts = { bug: 0, feature: 0, task: 0, docs: 0 };
    items.forEach((item) => {
      if (statusCounts[item.status] !== undefined) statusCounts[item.status]++;
      if (categoryCounts[item.category] !== undefined) categoryCounts[item.category]++;
    });

    const pendingItems = items.filter(i => i.status === 'pending').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const activeItems = items.filter(i => i.status === 'active').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    let actionsExecuted = 0;
    let summary = '';

    if (statusCounts.pending > 5) {
      const toActivate = pendingItems.slice(0, 3);
      await Promise.all(toActivate.map(item => base44.asServiceRole.entities.Item.update(item.id, { status: 'active' })));
      actionsExecuted = toActivate.length;
      summary = `Promoted ${actionsExecuted} pending items to active.`;
    } else if (statusCounts.active > 5) {
      const toDone = activeItems.slice(0, 2);
      await Promise.all(toDone.map(item => base44.asServiceRole.entities.Item.update(item.id, { status: 'done' })));
      actionsExecuted = toDone.length;
      summary = `Marked ${actionsExecuted} active items as done.`;
    } else {
      const statuses = ['pending', 'active', 'done'];
      const categories = ['bug', 'feature', 'task'];
      const newItems = [0, 1, 2].map((i) => ({
        title: `Agent item ${new Date().toLocaleTimeString()} #${i + 1}`,
        status: statuses[i],
        category: categories[i],
        number: Math.floor(Math.random() * 100),
      }));
      await base44.asServiceRole.entities.Item.bulkCreate(newItems);
      actionsExecuted = 3;
      summary = `Created 3 new sample items across different statuses and categories.`;
    }

    return Response.json({ summary, actionsExecuted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
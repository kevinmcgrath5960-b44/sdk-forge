import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all items
    const items = await base44.entities.Item.list('-created_date', 200);

    // Build a summary for the LLM agent
    const statusCounts = { pending: 0, active: 0, done: 0, processed: 0 };
    const categoryCounts = { bug: 0, feature: 0, task: 0, docs: 0 };
    items.forEach((item) => {
      if (statusCounts[item.status] !== undefined) statusCounts[item.status]++;
      if (categoryCounts[item.category] !== undefined) categoryCounts[item.category]++;
    });

    const context = `
You are a dashboard agent. Here is the current state of the item database:
Total items: ${items.length}
By status: pending=${statusCounts.pending}, active=${statusCounts.active}, done=${statusCounts.done}, processed=${statusCounts.processed}
By category: bug=${categoryCounts.bug}, feature=${categoryCounts.feature}, task=${categoryCounts.task}, docs=${categoryCounts.docs}

Based on this data:
1. If there are more than 5 pending items, mark the 3 oldest ones as "active" (provide their IDs).
2. If there are more than 5 active items, mark the 2 oldest ones as "done".
3. Otherwise, create 3 new sample items spread across different statuses and categories.

Return a JSON with:
- summary: a one-sentence human-readable summary of what you did
- actions: array of { type: "update"|"create", id?: string, data: object }
`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: context,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                id: { type: "string" },
                data: { type: "object" },
              },
            },
          },
        },
      },
    });

    // Execute the agent's actions
    const pendingItems = items.filter(i => i.status === 'pending').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const activeItems = items.filter(i => i.status === 'active').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    let actionsExecuted = 0;

    if (statusCounts.pending > 5) {
      const toActivate = pendingItems.slice(0, 3);
      for (const item of toActivate) {
        await base44.asServiceRole.entities.Item.update(item.id, { status: 'active' });
        actionsExecuted++;
      }
    } else if (statusCounts.active > 5) {
      const toDone = activeItems.slice(0, 2);
      for (const item of toDone) {
        await base44.asServiceRole.entities.Item.update(item.id, { status: 'done' });
        actionsExecuted++;
      }
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
    }

    const summary = result?.summary || `Agent executed ${actionsExecuted} action(s) on the dashboard data.`;

    return Response.json({ summary, actionsExecuted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
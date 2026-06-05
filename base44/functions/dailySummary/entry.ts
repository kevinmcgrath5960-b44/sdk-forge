import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get items created in the last 24 hours
    const allItems = await base44.asServiceRole.entities.Item.list('-created_date', 200);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentItems = allItems.filter(item => item.created_date >= oneDayAgo);

    const summary = recentItems.length === 0
      ? 'No new items were created in the last 24 hours.'
      : `${recentItems.length} item(s) created in the last 24 hours:\n\n` +
        recentItems.map(item => `• ${item.title} (${item.status}, ${item.category})`).join('\n');

    // Find an admin to email
    const users = await base44.asServiceRole.entities.User.list();
    const admin = users.find(u => u.role === 'admin');

    if (admin) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: 'SDK Playground — Daily Items Summary',
        body: `<h2>Daily Items Summary</h2><pre>${summary}</pre>`,
      });
    }

    return Response.json({ message: 'Daily summary sent', items_count: recentItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
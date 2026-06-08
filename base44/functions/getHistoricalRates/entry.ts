import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { from, to, group } = await req.json();
    if (!from) return Response.json({ error: 'from date is required' }, { status: 400 });

    let url = `https://api.frankfurter.dev/v2/rates?base=GBP&quotes=EUR,USD,DKK&from=${from}`;
    if (to) url += `&to=${to}`;
    if (group) url += `&group=${group}`;

    const res = await fetch(url);
    if (!res.ok) return Response.json({ error: `Frankfurter API error: ${res.status}` }, { status: 502 });

    const data = await res.json();
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
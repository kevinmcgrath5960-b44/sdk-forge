import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const base = body.base || 'USD';
    const targets = (body.targets || ['EUR', 'GBP', 'JPY']).join(',');

    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${targets}`);
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);

    const data = await res.json();
    return Response.json({ rates: data.rates, date: data.date, base: data.base });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
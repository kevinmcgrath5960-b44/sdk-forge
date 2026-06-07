import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, json_schema } = await req.json();
    if (!file_url || !json_schema) return Response.json({ error: 'file_url and json_schema are required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema });
    return Response.json({ output: result?.output || result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
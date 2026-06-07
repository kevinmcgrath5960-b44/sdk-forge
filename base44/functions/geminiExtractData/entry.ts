import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, json_schema } = await req.json();
    if (!file_url || !json_schema) return Response.json({ error: 'file_url and json_schema are required' }, { status: 400 });

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    // Fetch file from public URL and convert to base64
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return Response.json({ error: `Failed to fetch file (HTTP ${fileRes.status})` }, { status: 500 });
    }

    const fileBuffer = await fileRes.arrayBuffer();
    if (fileBuffer.byteLength === 0) {
      return Response.json({ error: 'File is empty' }, { status: 400 });
    }

    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    const mimeType = fileRes.headers.get("content-type") || "application/octet-stream";

    const schemaStr = JSON.stringify(json_schema, null, 2);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Extract structured data from this document according to the following JSON schema:\n${schemaStr}\n\nReturn ONLY a valid JSON object matching the schema, no extra text.`
              },
              {
                inline_data: { mime_type: mimeType, data: base64Data }
              }
            ]
          }],
          generationConfig: { response_mime_type: "application/json" }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data?.error?.message || "Gemini API error" }, { status: response.status });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return Response.json({ error: "No text response from Gemini API", details: data }, { status: 500 });
    }

    let output;
    try {
      output = JSON.parse(text);
    } catch (parseError) {
      return Response.json({ error: "Failed to parse JSON response", text, parseError: parseError.message }, { status: 500 });
    }

    return Response.json({ output });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
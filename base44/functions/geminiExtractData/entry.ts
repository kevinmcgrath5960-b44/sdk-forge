import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Model: gemini-1.5-flash runs on the FREE tier. Swap to "gemini-2.5-flash" if you prefer (may need PAYG).
const MODEL = "gemini-2.5-flash";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, json_schema } = await req.json();
    if (!file_url || !json_schema) {
      return Response.json({ error: 'file_url and json_schema are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });

    // Fetch the file from its public URL
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return Response.json({ error: `Failed to fetch file (HTTP ${fileRes.status})` }, { status: 502 });
    }

    const fileBuffer = await fileRes.arrayBuffer();
    if (fileBuffer.byteLength === 0) {
      return Response.json({ error: 'File is empty' }, { status: 400 });
    }

    // Convert to base64 in CHUNKS — spreading the whole byte array into
    // String.fromCharCode(...) overflows the call stack on real files (the 500 you saw).
    const bytes = new Uint8Array(fileBuffer);
    let binary = "";
    const CHUNK = 0x8000; // 32KB at a time
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    const base64Data = btoa(binary);
    const mimeType = fileRes.headers.get("content-type") || "application/octet-stream";

    const schemaStr = JSON.stringify(json_schema, null, 2);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
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
      console.error('Gemini API Error:', data);
      return Response.json({ error: data?.error?.message || "Gemini API error", details: data }, { status: response.status });
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
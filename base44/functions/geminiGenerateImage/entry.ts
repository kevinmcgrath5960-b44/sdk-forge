import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data?.error?.message || "Gemini API error" }, { status: response.status });
    }

    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return Response.json({ error: "No image returned" }, { status: 500 });

    // Upload the base64 image to Base44 storage and return a URL
    const imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob = new Blob([imageBytes], { type: "image/png" });
    const formData = new FormData();
    formData.append("file", blob, "generated.png");

    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });
    const url = uploadResult?.file_url || uploadResult?.url;

    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
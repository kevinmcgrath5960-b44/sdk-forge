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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data?.error?.message || "Gemini API error" }, { status: response.status });
    }

    // Find the image part in the response
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      return Response.json({ error: "No image returned from Gemini" }, { status: 500 });
    }

    const b64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";

    // Convert base64 to blob and upload
    const imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const blob = new Blob([imageBytes], { type: mimeType });

    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });
    const url = uploadResult?.file_url || uploadResult?.url;

    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
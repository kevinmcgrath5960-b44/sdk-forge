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

    // Return base64 data URL
    const dataUrl = `data:${mimeType};base64,${b64}`;
    return Response.json({ url: dataUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
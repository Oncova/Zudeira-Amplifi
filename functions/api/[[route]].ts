import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { GoogleGenAI } from '@google/genai';

type Bindings = {
    DB: D1Database;
    GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Safe base64 encoding for ArrayBuffers in Edge functions
function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        // @ts-ignore
        binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
}

// Health Check
app.get('/health', (c) => c.json({ status: 'ok', message: 'Hono server is running on Cloudflare Pages!' }));

// 1. Brand Identity Extraction
app.post('/ai/brand-identity', async (c) => {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const { name, website } = await c.req.json();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Extract brand identity for ${name} from website: ${website}. 
      Return JSON with: mission, tone, audience (array), valueProps (array), keywords (array), colors (array of hex), constraints (array).`,
            config: {
                responseMimeType: "application/json",
            }
        });

        return c.json(JSON.parse(response.text || '{}'));
    } catch (error) {
        console.error(error);
        return c.json({ error: 'AI Brand extraction failed' }, 500);
    }
});

// 2. Asset Tagging
app.post('/ai/tag-asset', async (c) => {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const { assetUrl } = await c.req.json();

    try {
        let base64Data = '';
        if (assetUrl.startsWith('data:')) {
            base64Data = assetUrl.split(',')[1];
        } else {
            const resp = await fetch(assetUrl);
            const buffer = await resp.arrayBuffer();
            base64Data = arrayBufferToBase64(buffer);
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                { text: "Tag this image for an ad campaign. Return JSON with: tags (array), ranking (1-10 based on visual appeal)." },
                { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });
        return c.json(JSON.parse(response.text || '{}'));
    } catch (error) {
        console.error(error);
        return c.json({ error: 'AI Tagging failed' }, 500);
    }
});

// 3. Creative Generation
app.post('/ai/generate-creative', async (c) => {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const { platform, goal, offer, cta, brand } = await c.req.json();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate an emotionally disruptive, psychologically compelling ad creative for ${platform}. 
      Goal: ${goal}. Offer: ${offer}. CTA: ${cta}. 
      Brand Identity: ${JSON.stringify(brand)}.
      
      Requirements:
      - Create tension within the first 2 seconds.
      - Use psychological triggers.
      
      Return JSON with: hook, coreMessage, visualDirection, emotionalTrigger, conversionMechanism, headline, body, hashtags (array).`,
            config: {
                systemInstruction: `You are a world-class performance marketer and psychological ad engineer.`,
                responseMimeType: "application/json",
            }
        });
        return c.json(JSON.parse(response.text || '{}'));
    } catch (error) {
        console.error(error);
        return c.json({ error: 'AI Creative generation failed' }, 500);
    }
});

// 4. Imagen Image Generation
app.post('/ai/generate-image', async (c) => {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const { prompt, count } = await c.req.json();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: count || 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        const imageUrls = response.generatedImages.map((img: any) => `data:image/jpeg;base64,${img.image.imageBytes}`);
        return c.json({ images: imageUrls });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'AI Image generation failed' }, 500);
    }
});

// 5. Imagen Image Editing
app.post('/ai/edit-image', async (c) => {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const { base64Image, prompt } = await c.req.json();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image.split(',')[1],
                            mimeType: 'image/jpeg',
                        },
                    },
                    { text: prompt },
                ],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return c.json({ image: `data:image/png;base64,${part.inlineData.data}` });
            }
        }
        throw new Error("No image returned from AI");
    } catch (error) {
        console.error(error);
        return c.json({ error: 'AI Image editing failed' }, 500);
    }
});

// 6. Veo Video Generation
app.post('/ai/generate-video', async (c) => {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const { prompt } = await c.req.json();
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '9:16' }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 8000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("No download link");

        const response = await fetch(downloadLink, {
            method: 'GET',
            headers: { 'x-goog-api-key': c.env.GEMINI_API_KEY },
        });

        const buffer = await response.arrayBuffer();
        const base64Video = arrayBufferToBase64(buffer);
        return c.json({ video: `data:video/mp4;base64,${base64Video}` });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'AI Video generation failed' }, 500);
    }
});

// --- DB Routes ---

app.post('/brand/save', async (c) => {
    const { businessId, website, name, brandIdentity } = await c.req.json();
    try {
        await c.env.DB.prepare(`
      INSERT OR REPLACE INTO business_profiles (id, name, website, brand_identity)
      VALUES (?, ?, ?, ?)
    `).bind(businessId, name, website, JSON.stringify(brandIdentity)).run();
        return c.json({ status: 'saved' });
    } catch (error) {
        return c.json({ error: 'Failed to save brand identity' }, 500);
    }
});

app.post('/assets/upload', async (c) => {
    const body = await c.req.json();
    const { businessId, assets } = body;
    try {
        const uploadedAssets = await Promise.all(assets.map(async (a: any) => {
            const id = Math.random().toString(36).substring(2, 11);
            const url = a.url;
            await c.env.DB.prepare(`
        INSERT INTO assets (id, business_id, url, type, tags, ranking)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, businessId, url, a.type, JSON.stringify(['Pending']), 0).run();
            return { id, url, type: a.type, tags: ['Pending'], ranking: 0 };
        }));
        return c.json(uploadedAssets);
    } catch (error) {
        return c.json({ error: 'Upload process failed' }, 500);
    }
});

app.post('/assets/update-tags', async (c) => {
    const { assetId, tags, ranking } = await c.req.json();
    try {
        await c.env.DB.prepare('UPDATE assets SET tags = ?, ranking = ? WHERE id = ?')
            .bind(JSON.stringify(tags), ranking, assetId).run();
        return c.json({ status: 'updated' });
    } catch (error) {
        return c.json({ error: 'Failed to update tags' }, 500);
    }
});

app.post('/creatives/save', async (c) => {
    const { businessId, creative } = await c.req.json();
    const { id, platform, mediaUrl, headline, body, cta, aspectRatio, hashtags, version, hook, coreMessage, visualDirection, emotionalTrigger, conversionMechanism } = creative;
    try {
        await c.env.DB.prepare(`
      INSERT INTO creatives (id, business_id, platform, media_url, headline, body, cta, aspect_ratio, hashtags, version, hook, core_message, visual_direction, emotional_trigger, conversion_mechanism)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, businessId, platform, mediaUrl, headline, body, cta, aspectRatio, JSON.stringify(hashtags), version, hook, coreMessage, visualDirection, emotionalTrigger, conversionMechanism).run();
        return c.json({ status: 'saved' });
    } catch (e) {
        return c.json({ error: 'Failed to save creative' }, 500);
    }
});

app.get('/creatives', async (c) => {
    const businessId = c.req.query('businessId');
    const { results } = await c.env.DB.prepare('SELECT * FROM creatives WHERE business_id = ?').bind(businessId).all();
    return c.json(results.map((r: any) => ({
        ...r,
        mediaUrl: r.media_url,
        aspectRatio: r.aspect_ratio,
        hashtags: JSON.parse(r.hashtags),
        coreMessage: r.core_message,
        visualDirection: r.visual_direction,
        emotionalTrigger: r.emotional_trigger,
        conversionMechanism: r.conversion_mechanism
    })));
});

app.post('/schedule/generate', async (c) => {
    const { businessId, creativeIds, startDate } = await c.req.json();
    const stmt = c.env.DB.prepare(`
    INSERT INTO schedules (id, business_id, creative_id, scheduled_at, platform)
    VALUES (?, ?, ?, ?, ?)
  `);
    const schedule = [];
    const stmtSelect = c.env.DB.prepare('SELECT * FROM creatives WHERE id = ?');

    for (let idx = 0; idx < creativeIds.length; idx++) {
        const cid = creativeIds[idx];
        const { results } = await stmtSelect.bind(cid).all();
        if (results.length > 0) {
            const creative = results[0] as any;
            const id = Math.random().toString(36).substring(2, 11);
            const date = new Date(startDate);
            date.setDate(date.getDate() + idx);
            const scheduledAt = date.toISOString();
            await stmt.bind(id, businessId, cid, scheduledAt, creative.platform).run();
            schedule.push({ id, creativeId: cid, scheduledAt, platform: creative.platform });
        }
    }
    return c.json(schedule);
});

export const onRequest = handle(app);

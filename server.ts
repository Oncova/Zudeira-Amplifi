import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize GCS
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucketName = process.env.GCS_BUCKET_NAME || 'zuldeira-amplifi-output';
const bucket = storage.bucket(bucketName);

const db = new Database('zuldeira.db');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS business_profiles (
    id TEXT PRIMARY KEY,
    name TEXT,
    website TEXT,
    ig TEXT,
    fb TEXT,
    tt TEXT,
    brand_identity TEXT
  );
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    url TEXT,
    tags TEXT,
    type TEXT,
    ranking INTEGER
  );
  CREATE TABLE IF NOT EXISTS creatives (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    platform TEXT,
    media_url TEXT,
    headline TEXT,
    body TEXT,
    cta TEXT,
    aspect_ratio TEXT,
    hashtags TEXT,
    version INTEGER,
    hook TEXT,
    core_message TEXT,
    visual_direction TEXT,
    emotional_trigger TEXT,
    conversion_mechanism TEXT
  );
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    creative_id TEXT,
    scheduled_at TEXT,
    platform TEXT
  );
`);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- AI Generation Routes ---

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // 1. Brand Identity Extraction
  app.post('/api/ai/brand-identity', async (req, res) => {
    const { name, website } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract brand identity for ${name} from website: ${website}. 
      Return JSON with: mission, tone, audience (array), valueProps (array), keywords (array), colors (array of hex), constraints (array).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mission: { type: Type.STRING },
              tone: { type: Type.STRING },
              audience: { type: Type.ARRAY, items: { type: Type.STRING } },
              valueProps: { type: Type.ARRAY, items: { type: Type.STRING } },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              colors: { type: Type.ARRAY, items: { type: Type.STRING } },
              constraints: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["mission", "tone", "audience", "valueProps", "keywords", "colors", "constraints"]
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'AI Brand extraction failed' });
    }
  });

  // 2. Asset Tagging
  app.post('/api/ai/tag-asset', async (req, res) => {
    const { assetUrl } = req.body;
    try {
      // If it's a data URL, extract base64. If it's a GCS URL, we might need to fetch it or use a different part type.
      // For simplicity, assuming the frontend sends base64 or we fetch the GCS URL.
      let base64Data = '';
      if (assetUrl.startsWith('data:')) {
        base64Data = assetUrl.split(',')[1];
      } else {
        // Fetch from GCS
        const response = await fetch(assetUrl);
        const buffer = await response.arrayBuffer();
        base64Data = Buffer.from(buffer).toString('base64');
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { text: "Tag this image for an ad campaign. Return JSON with: tags (array), ranking (1-10 based on visual appeal)." },
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              ranking: { type: Type.INTEGER }
            }
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'AI Tagging failed' });
    }
  });

  // 3. Creative Content Generation
  app.post('/api/ai/generate-creative', async (req, res) => {
    const { platform, goal, offer, cta, brand } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate an emotionally disruptive, psychologically compelling ad creative for ${platform}. 
      Goal: ${goal}. Offer: ${offer}. CTA: ${cta}. 
      Brand Identity: ${JSON.stringify(brand)}.
      
      Requirements:
      - Create tension within the first 2 seconds.
      - Introduce a controversial or polarizing statement.
      - Imply the viewer is behind, unaware, or missing an opportunity.
      - Leverage social proof in a subtle but powerful way.
      - Use psychological triggers such as scarcity, exclusivity, authority, or insider knowledge.
      - Feel native to the platform, not corporate or polished.
      - Use raw, authentic, almost confrontational tone.
      - Avoid polished stock-photo aesthetics.
      - Favor high contrast, dramatic lighting, bold on-screen text, and attention-grabbing compositions.
      
      Return JSON with: hook, coreMessage, visualDirection, emotionalTrigger, conversionMechanism, headline, body, hashtags (array).`,
        config: {
          systemInstruction: `You are a world-class performance marketer and psychological ad engineer. 
Your job is to create emotionally disruptive, psychologically compelling ad concepts designed to stop scrolling and trigger strong reactions such as outrage, fear of missing out, status anxiety, curiosity, or social comparison.

Do NOT create generic ads.
Do NOT use basic marketing language.
Do NOT use cliché calls to action like “Buy Now” or “Limited Time Offer.”`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              coreMessage: { type: Type.STRING },
              visualDirection: { type: Type.STRING },
              emotionalTrigger: { type: Type.STRING },
              conversionMechanism: { type: Type.STRING },
              headline: { type: Type.STRING },
              body: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["hook", "coreMessage", "visualDirection", "emotionalTrigger", "conversionMechanism", "headline", "body", "hashtags"]
          }
        }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'AI Creative generation failed' });
    }
  });

  // 4. Imagen Image Generation
  app.post('/api/ai/generate-image', async (req, res) => {
    const { prompt, count } = req.body;
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

      const imageUrls = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
      res.json({ images: imageUrls });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'AI Image generation failed' });
    }
  });

  // 5. Imagen Image Editing
  app.post('/api/ai/edit-image', async (req, res) => {
    const { base64Image, prompt } = req.body;
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
            {
              text: prompt,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return res.json({ image: `data:image/png;base64,${part.inlineData.data}` });
        }
      }
      throw new Error("No image returned from AI");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'AI Image editing failed' });
    }
  });

  // 6. Veo Video Generation
  app.post('/api/ai/generate-video', async (req, res) => {
    const { prompt } = req.body;
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '9:16'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation failed - no download link");

      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': (process.env.GEMINI_API_KEY as string),
        },
      });

      const buffer = await response.arrayBuffer();
      const base64Video = Buffer.from(buffer).toString('base64');
      res.json({ video: `data:video/mp4;base64,${base64Video}` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'AI Video generation failed' });
    }
  });

  // 1. Brand Extraction (Save Only)
  app.post('/api/brand/save', (req, res) => {
    const { businessId, website, name, brandIdentity } = req.body;

    try {
      db.prepare(`
        INSERT OR REPLACE INTO business_profiles (id, name, website, brand_identity)
        VALUES (?, ?, ?, ?)
      `).run(businessId, name, website, JSON.stringify(brandIdentity));

      res.json({ status: 'saved' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save brand identity' });
    }
  });

  // 2. Asset Upload & Tagging (Save Tagging Results)
  app.post('/api/assets/upload', async (req, res) => {
    const { businessId, assets } = req.body; // assets is array of { url, type }

    try {
      if (!businessId) {
        return res.status(400).json({ error: 'Missing businessId' });
      }

      if (!Array.isArray(assets)) {
        return res.status(400).json({ error: 'Assets must be an array' });
      }

      if (assets.length === 0) {
        return res.status(400).json({ error: 'No assets provided' });
      }

      const uploadedAssets = await Promise.all(assets.map(async (a: any) => {
        if (!a.url || !a.type) {
          throw new Error('Each asset must have url and type');
        }

        const id = Math.random().toString(36).substr(2, 9);
        let finalUrl = a.url; // Default to the base64 data URL for local usage

        // Try GCS Upload, but fallback seamlessly if bucket isn't configured
        if (a.url.startsWith('data:') && process.env.GOOGLE_APPLICATION_CREDENTIALS && bucketName) {
          try {
            const mimeType = a.url.split(';')[0].split(':')[1];
            const extension = mimeType.split('/')[1];
            const base64Data = a.url.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            const folder = a.type === 'video' ? 'videos' : businessId;
            const fileName = `${folder}/${id}.${extension}`;
            const file = bucket.file(fileName);

            await file.save(buffer, {
              metadata: { contentType: mimeType },
              public: true,
            });

            finalUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
          } catch (gcsError) {
            console.warn("GCS Upload failed, falling back to local Base64 storage:", gcsError);
          }
        }

        db.prepare(`
          INSERT INTO assets (id, business_id, url, type, tags, ranking)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, businessId, finalUrl, a.type, JSON.stringify(['Pending']), 0);

        return { id, url: finalUrl, type: a.type, tags: ['Pending'], ranking: 0 };
      }));

      res.json(uploadedAssets);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Upload error:', errorMessage, error);
      res.status(500).json({ error: `Failed to process asset upload: ${errorMessage}` });
    }
  });

  app.post('/api/assets/update-tags', (req, res) => {
    const { assetId, tags, ranking } = req.body;
    try {
      if (!assetId) {
        return res.status(400).json({ error: 'Missing assetId' });
      }

      db.prepare('UPDATE assets SET tags = ?, ranking = ? WHERE id = ?').run(JSON.stringify(tags), ranking, assetId);
      res.json({ status: 'updated' });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('Update tags error:', errorMessage, e);
      res.status(500).json({ error: `Failed to update tags: ${errorMessage}` });
    }
  });

  // 3. Creative Generation (Save Only)
  app.post('/api/creatives/save', (req, res) => {
    const { businessId, creative } = req.body;
    const { id, platform, mediaUrl, headline, body, cta, aspectRatio, hashtags, version, hook, coreMessage, visualDirection, emotionalTrigger, conversionMechanism } = creative;

    try {
      db.prepare(`
        INSERT INTO creatives (id, business_id, platform, media_url, headline, body, cta, aspect_ratio, hashtags, version, hook, core_message, visual_direction, emotional_trigger, conversion_mechanism)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, businessId, platform, mediaUrl, headline, body, cta, aspectRatio, JSON.stringify(hashtags), version, hook, coreMessage, visualDirection, emotionalTrigger, conversionMechanism);

      res.json({ status: 'saved' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to save creative' });
    }
  });

  app.get('/api/creatives', (req, res) => {
    const { businessId } = req.query;
    const rows = db.prepare('SELECT * FROM creatives WHERE business_id = ?').all(businessId) as any[];
    res.json(rows.map(r => ({
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

  // 4. Schedule
  app.post('/api/schedule/generate', (req, res) => {
    const { businessId, creativeIds, startDate } = req.body;

    const stmt = db.prepare(`
      INSERT INTO schedules (id, business_id, creative_id, scheduled_at, platform)
      VALUES (?, ?, ?, ?, ?)
    `);

    const schedule = creativeIds.map((cid: string, idx: number) => {
      const creative = db.prepare('SELECT * FROM creatives WHERE id = ?').get(cid) as any;
      const id = Math.random().toString(36).substr(2, 9);
      const date = new Date(startDate);
      date.setDate(date.getDate() + idx);
      const scheduledAt = date.toISOString();

      stmt.run(id, businessId, cid, scheduledAt, creative.platform);
      return { id, creativeId: cid, scheduledAt, platform: creative.platform };
    });

    res.json(schedule);
  });

  app.get('/api/schedule/export.csv', (req, res) => {
    const { businessId, platform } = req.query;
    let query = `
      SELECT s.*, c.headline, c.body, c.media_url, c.cta, c.hashtags, c.hook
      FROM schedules s 
      JOIN creatives c ON s.creative_id = c.id 
      WHERE s.business_id = ?
    `;
    const params: any[] = [businessId];

    if (platform && platform !== 'all') {
      query += ` AND s.platform = ?`;
      params.push(platform);
    }

    const schedules = db.prepare(query).all(...params) as any[];

    const headers = ['Date', 'Time', 'Platform', 'Headline', 'Body', 'Media URL', 'CTA', 'Hashtags', 'Hook'];
    const rows = schedules.map(s => {
      const date = new Date(s.scheduled_at);
      const hashtags = JSON.parse(s.hashtags || '[]').join(' ');
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        s.platform,
        `"${(s.headline || '').replace(/"/g, '""')}"`,
        `"${(s.body || '').replace(/"/g, '""')}"`,
        s.media_url,
        s.cta,
        `"${hashtags.replace(/"/g, '""')}"`,
        `"${(s.hook || '').replace(/"/g, '""')}"`
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = platform && platform !== 'all' ? `schedule_${platform}.csv` : 'schedule_all.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  });

  // --- Vite Middleware ---
  // Setup API route protection BEFORE static file serving
  app.use('/api/', (req, res, next) => {
    // Log API requests for debugging
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files but skip API routes
    app.use(express.static(path.join(__dirname, 'dist'), {
      // Skip serving static files for API routes
      skip: (req) => req.path.startsWith('/api/')
    }));
    
    // Catch-all for SPA - only for non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

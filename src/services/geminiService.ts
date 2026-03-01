export async function extractBrandIdentity(name: string, website: string) {
  const response = await fetch('/api/ai/brand-identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, website })
  });
  if (!response.ok) throw new Error('AI Brand extraction failed');
  return response.json();
}

export async function tagAsset(assetUrl: string) {
  const response = await fetch('/api/ai/tag-asset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetUrl })
  });
  if (!response.ok) throw new Error('AI Tagging failed');
  return response.json();
}

export async function generateCreativeContent(platform: string, goal: string, offer: string, cta: string, brand: any) {
  const response = await fetch('/api/ai/generate-creative', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, goal, offer, cta, brand })
  });
  if (!response.ok) throw new Error('AI Creative generation failed');
  return response.json();
}

export async function generateImagenImages(prompt: string, count: number = 1) {
  const response = await fetch('/api/ai/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, count })
  });
  if (!response.ok) throw new Error('AI Image generation failed');
  const data = await response.json();
  return data.images;
}

export async function editImagenImage(base64Image: string, prompt: string) {
  const response = await fetch('/api/ai/edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, prompt })
  });
  if (!response.ok) throw new Error('AI Image editing failed');
  const data = await response.json();
  return data.image;
}

export async function generateVeoVideo(prompt: string) {
  const response = await fetch('/api/ai/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) throw new Error('AI Video generation failed');
  const data = await response.json();
  return data.video;
}

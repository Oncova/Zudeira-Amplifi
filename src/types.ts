export type Platform = 'instagram_feed' | 'instagram_story' | 'facebook_feed' | 'tiktok' | 'web_banner';

export interface BrandIdentity {
  colors: string[];
  tone: string;
  audience: string[];
  valueProps: string[];
  keywords: string[];
  constraints: string[];
  mission?: string;
  name?: string;
}

export interface BusinessProfile {
  name: string;
  website: string;
  ig?: string;
  fb?: string;
  tt?: string;
}

export interface Asset {
  id: string;
  url: string;
  tags: string[];
  type: 'image' | 'video';
  ranking?: number;
}

export interface Creative {
  id: string;
  platform: Platform;
  mediaUrl: string;
  headline: string;
  body: string;
  cta: string;
  aspectRatio: string;
  hashtags?: string[];
  version?: number;
  hook?: string;
  coreMessage?: string;
  visualDirection?: string;
  emotionalTrigger?: string;
  conversionMechanism?: string;
}

export interface Campaign {
  id: string;
  goal: string;
  offer: string;
  cta: string;
  selectedAssetIds: string[];
  platforms: Platform[];
}

export interface CreativeBrief {
  id: string;
  campaignId: string;
  angle: string;
  hooks: string[];
  keyMessaging: string[];
}

export interface CaptionPack {
  platform: Platform;
  captions: string[];
  hashtags: string[];
}

export interface ScheduleItem {
  id: string;
  creativeId: string;
  scheduledAt: string;
  platform: Platform;
}

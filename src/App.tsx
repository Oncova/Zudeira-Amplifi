import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Upload, 
  Sparkles, 
  Library, 
  Settings, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  AlertCircle,
  ExternalLink,
  Instagram,
  Facebook,
  Globe,
  Smartphone,
  Image as ImageIcon,
  Video as VideoIcon,
  Palette,
  MessageSquare,
  Users,
  Target,
  Clock,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandIdentity, BusinessProfile, Asset, Creative, ScheduleItem, Platform } from './types';
import { extractBrandIdentity, tagAsset, generateCreativeContent, generateImagenImages, generateVeoVideo, editImagenImage } from './services/geminiService';

const VEO_PROMPT = "Generate a high-converting 9:16 vertical cinematic social media video advertisement for a premium event planning brand called 'Events Made Easy.' The video must be emotionally engineered to trigger FOMO (fear of missing out), social comparison, status aspiration, and subtle regret avoidance. Show an unforgettable upscale celebration with elegant decor, dramatic layered lighting, stylish well-dressed guests confidently laughing and celebrating, close-up detail shots of premium table settings, champagne pours in slow motion, warm golden ambient lighting, and dynamic camera movement (slow cinematic pans, shallow depth-of-field focus shifts, subtle motion blur transitions). The atmosphere should feel exclusive, high-demand, and limited availability — like an experience only a select few gain access to. Visually imply that choosing an average event would be disappointing without directly showing failure. Use cinematic color grading with warm gold, blush, and soft neutral tones, high contrast highlights, smooth motion, premium production quality, and emotionally charged reactions from guests. Structure the composition intentionally with safe negative space in the top and bottom thirds for headline and call-to-action overlays. Do NOT render any text in the video. The final output should look like a paid Instagram Reel or TikTok ad designed to stop scrolling immediately, evoke urgency, excitement, exclusivity, and the fear of missing out.";

const IMAGEN_PROMPTS = [
  {
    id: 'fomo',
    label: 'Intense FOMO',
    description: 'Focus on exclusivity and high demand.',
    prompt: "Create a high-converting social media advertisement image for a premium event planning brand called “Events Made Easy.” This variation must focus on intense FOMO (fear of missing out). Show an unforgettable, visually stunning celebration with elegant décor, dramatic lighting, stylish well-dressed guests laughing confidently, and a vibrant upscale atmosphere. The image should imply exclusivity and high demand, as if access is limited and only a select few experience events like this. Use cinematic lighting, warm gold and blush tones, high contrast, shallow depth of field, and professional photography quality. Composition must follow proven ad design structure: strong focal point in the center, intentional negative space in the top and bottom thirds for headline and call-to-action overlays. Do NOT render any text. Leave clean overlay space. The final image should feel urgent, exclusive, and scroll-stopping."
  },
  {
    id: 'regret',
    label: 'Regret Avoidance',
    description: 'Highlight the difference of professional design.',
    prompt: "Create a high-converting social media advertisement image for a premium event planning brand called “Events Made Easy.” This variation must focus on regret avoidance. Visually imply the difference between an ordinary, forgettable event and a stunning professionally designed celebration (without directly showing failure). Highlight emotional reactions: guests impressed, smiling, capturing photos, clearly experiencing something exceptional. The lighting should feel elevated and polished, with premium décor and cohesive design elements. Use dynamic composition, dramatic contrast, and intentional clean space in the top and bottom thirds for marketing overlays. Do NOT render any text. The image should subtly make viewers fear settling for average and feel motivated to upgrade their event experience."
  },
  {
    id: 'status',
    label: 'Status Elevation',
    description: 'Signal success, taste, and social prestige.',
    prompt: "Create a high-converting social media advertisement image for a premium event planning brand called “Events Made Easy.” This variation must focus on status elevation and aspiration. Show a luxurious, modern celebration that signals success, taste, and social prestige. Include elegant décor, refined styling, confident well-dressed guests, and a visually cohesive upscale environment. The image should make viewers associate booking this brand with higher status and social validation. Use cinematic color grading, premium textures, soft bokeh background, warm highlights, and sharp professional detail. Follow strategic ad composition with a strong central focal point and intentional negative space in the top and bottom thirds for headline and call-to-action overlays. Do NOT render any text. The final image should feel aspirational, exclusive, and worthy of a paid Instagram, Facebook, or TikTok ad."
  }
];

// --- Mock Data & Services ---
const INITIAL_BRAND: BrandIdentity = {
  colors: ['#D4AF37', '#FFFFFF', '#FF6321', '#000000', '#F5F5F0'],
  tone: 'Conversational, Warm, Encouraging, Service-first, Solution-oriented',
  audience: ['Young Professionals (25-45)', 'Parents', 'Couples', 'Community Organizers'],
  valueProps: [
    'One call. Complete event.',
    'Enjoy your event. We handle the rest.',
    'Designed around your vision.',
    'Events guests won’t forget.'
  ],
  keywords: ['Stress-free', 'Custom', 'Personalization', 'Convenience', 'Memorable'],
  constraints: ['NOT corporate', 'NOT luxury formal', 'DMV region focused']
};

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'upload' | 'create' | 'library'>('brand');
  const [business, setBusiness] = useState<BusinessProfile>({ 
    name: 'Events Made Easy', 
    website: 'https://eventsmadeeasy4u.com/',
    ig: '@eventsmadeeasy',
    fb: 'https://www.facebook.com/people/Events-Made-Easy/100069703359100/?sk=about',
    tt: '@eventmadeeasy'
  });
  const [brand, setBrand] = useState<BrandIdentity>(INITIAL_BRAND);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const businessId = 'events-made-easy'; // Static for demo

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/creatives?businessId=${businessId}`);
        const data = await res.json();
        setCreatives(data);
      } catch (err) {
        console.error("Failed to fetch creatives", err);
      }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExtracting(true);
    try {
      // 1. Extract Brand Identity on Frontend
      const brandData = await extractBrandIdentity(business.name, business.website);
      
      // 2. Save to Backend
      await fetch('/api/brand/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId, 
          website: business.website, 
          name: business.name,
          brandIdentity: brandData
        })
      });

      setBrand(brandData);
      setOnboarded(true);
    } catch (error) {
      console.error(error);
      alert("Failed to extract brand identity. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  if (!onboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-card p-8 rounded-3xl shadow-2xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Zuldeira Amplifi</h1>
          </div>

          {isExtracting ? (
            <div className="space-y-6 py-12 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full border-4 border-white/10 border-t-violet-500 rounded-full"
                />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-500 w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white">Analyzing your brand...</h2>
                <p className="text-sm text-slate-400">Scraping website and extracting identity DNA.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOnboard} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Business Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    placeholder="Acme Corp"
                    value={business.name}
                    onChange={e => setBusiness({...business, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Website URL</label>
                  <input 
                    required
                    type="url" 
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    placeholder="https://acme.com"
                    value={business.website}
                    onChange={e => setBusiness({...business, website: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1 text-[10px] uppercase tracking-wider">Instagram</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                      placeholder="@handle"
                      value={business.ig}
                      onChange={e => setBusiness({...business, ig: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1 text-[10px] uppercase tracking-wider">Facebook</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                      placeholder="URL"
                      value={business.fb}
                      onChange={e => setBusiness({...business, fb: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1 text-[10px] uppercase tracking-wider">TikTok</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                      placeholder="@handle"
                      value={business.tt}
                      onChange={e => setBusiness({...business, tt: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
              >
                Start Extraction <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden">
      <div className="atmosphere" />
      
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-72 glass-card border-r border-white/10 p-8 flex flex-col gap-10 z-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="text-white w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-white leading-none">AMPLIFI</span>
            <span className="text-[10px] font-bold text-violet-400 tracking-[0.2em] uppercase">Zuldeira AI</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <NavButton 
            active={activeTab === 'brand'} 
            onClick={() => setActiveTab('brand')} 
            icon={<Target className="w-5 h-5" />} 
            label="Brand Pulse" 
          />
          <NavButton 
            active={activeTab === 'upload'} 
            onClick={() => setActiveTab('upload')} 
            icon={<ImageIcon className="w-5 h-5" />} 
            label="Media Assets" 
          />
          <NavButton 
            active={activeTab === 'create'} 
            onClick={() => setActiveTab('create')} 
            icon={<Sparkles className="w-5 h-5" />} 
            label="Ad Engine" 
          />
          <NavButton 
            active={activeTab === 'library'} 
            onClick={() => setActiveTab('library')} 
            icon={<Calendar className="w-5 h-5" />} 
            label="Schedule & Export" 
          />
        </div>

        <div className="mt-auto p-5 bg-white/5 rounded-[2rem] border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/10">
              {business.name?.charAt(0) || 'B'}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold truncate text-white">{business.name || 'My Business'}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-semibold">Active Profile</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-2">
              <Globe className="w-3 h-3 text-slate-500" />
              <Instagram className="w-3 h-3 text-slate-500" />
            </div>
            <button className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-widest">Switch</button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'brand' && (
            <BrandTab key="brand" brand={brand} setBrand={setBrand} />
          )}
          {activeTab === 'upload' && (
            <UploadTab key="upload" assets={assets} setAssets={setAssets} />
          )}
          {activeTab === 'create' && (
            <CreateTab 
              key="create" 
              brand={brand} 
              assets={assets} 
              creatives={creatives} 
              setCreatives={setCreatives} 
            />
          )}
          {activeTab === 'library' && (
            <LibraryTab 
              key="library" 
              creatives={creatives} 
              schedule={schedule} 
              setSchedule={setSchedule} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Components ---

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative
        ${active 
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
        {icon}
      </span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        />
      )}
    </button>
  );
}

function BrandTab({ brand, setBrand }: { brand: BrandIdentity, setBrand: (b: BrandIdentity) => void, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="space-y-12 max-w-6xl mx-auto"
    >
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-bold text-violet-400 uppercase tracking-widest">Brand Pulse</div>
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-white leading-none">Your Brand DNA</h2>
        <p className="text-lg text-slate-400 max-w-2xl">We've decoded your brand's mission, tone, and audience. This is the foundation for every ad we engineer.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mission & Tone */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-10 rounded-[3rem] space-y-6 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-colors duration-500" />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest">Mission Statement</h3>
              <p className="text-2xl font-bold text-white leading-tight italic">"{brand.mission || 'To simplify event planning and create unforgettable memories.'}"</p>
            </div>
            <div className="pt-6 border-t border-white/5 space-y-2">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Brand Tone</h3>
              <textarea 
                className="w-full h-24 p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                value={brand.tone}
                onChange={e => setBrand({...brand, tone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-[2.5rem] space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4" /> Target Audience
              </h3>
              <div className="flex flex-wrap gap-2">
                {brand.audience?.map((a, i) => (
                  <span key={i} className="px-4 py-2 bg-white/5 rounded-2xl text-sm font-medium text-slate-300 border border-white/5 flex items-center gap-2 group/tag">
                    {a}
                    <Trash2 className="w-3 h-3 cursor-pointer opacity-0 group-hover/tag:opacity-50 hover:!opacity-100 transition-opacity" onClick={() => setBrand({...brand, audience: brand.audience.filter((_, idx) => idx !== i)})} />
                  </span>
                ))}
                <button className="px-4 py-2 border border-dashed border-white/10 rounded-2xl text-sm text-slate-500 hover:border-violet-500 hover:text-violet-500 transition-all">
                  + Add Segment
                </button>
              </div>
            </div>
            <div className="glass-card p-8 rounded-[2.5rem] space-y-4">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Value Propositions
              </h3>
              <div className="space-y-3">
                {brand.valueProps?.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 group/vp">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <p className="text-sm text-slate-300 leading-snug flex-1">{v}</p>
                    <Trash2 className="w-3 h-3 cursor-pointer opacity-0 group-hover/vp:opacity-50 hover:!opacity-100 transition-opacity mt-1" onClick={() => setBrand({...brand, valueProps: brand.valueProps.filter((_, idx) => idx !== i)})} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Identity */}
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Color Palette</h3>
            <div className="grid grid-cols-2 gap-4">
              {brand.colors?.map((c, i) => (
                <div key={i} className="space-y-2 group/color relative">
                  <div className="h-20 rounded-2xl shadow-inner border border-white/10" style={{ backgroundColor: c }} />
                  <p className="text-[10px] font-mono text-center text-slate-500 uppercase">{c}</p>
                  <button className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover/color:opacity-100 transition-opacity" onClick={() => setBrand({...brand, colors: brand.colors.filter((_, idx) => idx !== i)})}>
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button className="h-20 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 hover:border-violet-500 hover:text-violet-500 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {brand.keywords?.map((k, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-500/20 flex items-center gap-2 group/key">
                  #{k}
                  <Trash2 className="w-3 h-3 cursor-pointer opacity-0 group-hover/key:opacity-50 hover:!opacity-100 transition-opacity" onClick={() => setBrand({...brand, keywords: brand.keywords.filter((_, idx) => idx !== i)})} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

        {/* Value Props */}
        <div className="glass-card p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Target className="w-5 h-5 text-violet-500" />
            Value Propositions
          </div>
          <div className="space-y-2">
            {brand.valueProps?.map((prop, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl text-sm text-slate-300">
                <Check className="w-4 h-4 text-emerald-500" />
                {prop}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UploadTab({ assets, setAssets }: { assets: Asset[], setAssets: React.Dispatch<React.SetStateAction<Asset[]>>, key?: string }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isTagging, setIsTagging] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState(IMAGEN_PROMPTS[0].id);

  const handleEditImage = async (asset: Asset) => {
    const editPrompt = prompt("What would you like to change in this image? (e.g., 'add more gold decorations', 'make it look more like a night party')");
    if (!editPrompt) return;

    setIsEditing(asset.id);
    try {
      const newUrl = await editImagenImage(asset.url, editPrompt);
      
      // Save new asset
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'events-made-easy', assets: [{ url: newUrl, type: 'image' }] })
      });
      const [newAsset] = await response.json();
      
      // Tag new asset
      const { tags, ranking } = await tagAsset(newUrl);
      await fetch('/api/assets/update-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: newAsset.id, tags, ranking })
      });

      setAssets(prev => [...prev, { ...newAsset, tags, ranking }]);
      alert("Image edited successfully! The new version has been added to your library.");
    } catch (error) {
      console.error("Edit failed", error);
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsEditing(null);
    }
  };

  const handleGenerateAIImages = async () => {
    const selectedPrompt = IMAGEN_PROMPTS.find(p => p.id === selectedPromptId);
    if (!selectedPrompt) return;

    setIsGeneratingAI(true);
    try {
      const imageUrls = await generateImagenImages(selectedPrompt.prompt, 2); // Generate 2 for now
      
      const assetData = imageUrls.map(url => ({
        url,
        type: 'image' as const
      }));

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'events-made-easy', assets: assetData })
      });
      const newAssets = await response.json();
      setAssets(prev => [...prev, ...newAssets]);

      // Trigger Tagging for AI images too
      setIsTagging(true);
      for (const asset of newAssets) {
        try {
          const { tags, ranking } = await tagAsset(asset.url);
          await fetch('/api/assets/update-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId: asset.id, tags, ranking })
          });
          
          setAssets(prev => prev.map(a => 
            a.id === asset.id ? { ...a, tags, ranking } : a
          ));
        } catch (err) {
          console.error("Tagging failed for", asset.id, err);
        }
      }
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("AI Image generation failed. Please try again.");
    } finally {
      setIsGeneratingAI(false);
      setIsTagging(false);
    }
  };

  const handleGenerateVideo = async () => {
    // Check for API key as per Veo guidelines
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
      // Proceed after opening key selector
    }

    setIsGeneratingVideo(true);
    try {
      const videoUrl = await generateVeoVideo(VEO_PROMPT);
      
      const assetData = [{
        url: videoUrl,
        type: 'video' as const
      }];

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'events-made-easy', assets: assetData })
      });
      const newAssets = await response.json();
      setAssets(prev => [...prev, ...newAssets]);

      alert("Video generated successfully! It's now in your media library.");
    } catch (error: any) {
      console.error("Video Generation failed", error);
      if (error.message?.includes("Requested entity was not found")) {
        await (window as any).aistudio.openSelectKey();
      }
      alert("Video generation failed. Please ensure you have a valid paid API key selected.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length > 15) {
      alert("You can only upload up to 15 photos at a time.");
      return;
    }

    const filePromises = Array.from(files).map((file: File) => {
      return new Promise<{ url: string, type: 'image' | 'video' }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({ 
            url: event.target?.result as string, 
            type: file.type.startsWith('video') ? 'video' : 'image' 
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const assetData = await Promise.all(filePromises);
    
    try {
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'events-made-easy', assets: assetData })
      });
      const newAssets = await response.json();
      setAssets(prev => [...prev, ...newAssets]);

      // Trigger Tagging on Frontend
      setIsTagging(true);
      for (const asset of newAssets) {
        try {
          const { tags, ranking } = await tagAsset(asset.url);
          await fetch('/api/assets/update-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId: asset.id, tags, ranking })
          });
          
          setAssets(prev => prev.map(a => 
            a.id === asset.id ? { ...a, tags, ranking } : a
          ));
        } catch (err) {
          console.error("Tagging failed for", asset.id, err);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTagging(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="space-y-12 max-w-7xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest w-fit">Media Lab</div>
          <h2 className="text-5xl font-black tracking-tighter text-white leading-none">Asset Library</h2>
          <p className="text-lg text-slate-400">Upload your own or engineer new ones with AI.</p>
        </div>
        <div className="flex items-center gap-4">
          <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 bg-white text-black rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
          >
            <Plus className="w-5 h-5" /> Upload Media
          </button>
        </div>
      </header>

      {/* AI Generation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-[3rem] space-y-6 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-colors" />
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-violet-500" /> AI Photo Studio
            </h3>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Imagen 4.0</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {IMAGEN_PROMPTS.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedPromptId(p.id)}
                className={`p-4 rounded-2xl border transition-all text-left space-y-1 ${selectedPromptId === p.id ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                <p className="text-xs font-bold uppercase tracking-wider">{p.label}</p>
                <p className="text-[10px] opacity-70 leading-tight">{p.description}</p>
              </button>
            ))}
          </div>
          <button 
            onClick={handleGenerateAIImages}
            disabled={isGeneratingAI}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {isGeneratingAI ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Sparkles className="w-5 h-5" />}
            {isGeneratingAI ? 'Engineering Photos...' : 'Generate AI Photography'}
          </button>
        </div>

        <div className="glass-card p-8 rounded-[3rem] space-y-6 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl group-hover:bg-emerald-600/20 transition-colors" />
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <VideoIcon className="w-6 h-6 text-emerald-500" /> AI Video Engine
            </h3>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Veo 3.1</div>
          </div>
          <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">Cinematic 9:16 vertical ads engineered for FOMO and status elevation. Perfect for Reels & TikTok.</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded-md uppercase tracking-widest">1080p</span>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded-md uppercase tracking-widest">9:16</span>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded-md uppercase tracking-widest">Cinematic</span>
            </div>
          </div>
          <button 
            onClick={handleGenerateVideo}
            disabled={isGeneratingVideo}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {isGeneratingVideo ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <VideoIcon className="w-5 h-5" />}
            {isGeneratingVideo ? 'Engineering Video...' : 'Generate Cinematic Ad'}
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white tracking-tight">Your Media</h3>
          {isTagging && (
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 text-violet-400 rounded-full text-xs font-bold border border-violet-500/20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full" />
              AI Tagging in progress...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {assets.map(asset => (
            <motion.div 
              layout
              key={asset.id} 
              className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 shadow-sm"
            >
              {asset.type === 'video' ? (
                <video src={asset.url} className="w-full h-full object-cover" controls={false} autoPlay muted loop />
              ) : (
                <img src={asset.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end gap-3">
                <div className="flex flex-wrap gap-1">
                  {asset.tags?.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[9px] font-bold text-white uppercase tracking-widest">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {asset.type === 'image' && (
                      <button 
                        onClick={() => handleEditImage(asset)}
                        disabled={isEditing === asset.id}
                        className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-lg shadow-violet-500/20"
                      >
                        {isEditing === asset.id ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> : <Palette className="w-4 h-4" />}
                      </button>
                    )}
                    <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-md">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setAssets(assets.filter(a => a.id !== asset.id))}
                    className="p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {asset.ranking && asset.ranking > 0 && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-black text-[10px] font-black rounded-lg shadow-lg">
                  {asset.ranking}/10
                </div>
              )}
            </motion.div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full py-24 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem]">
              <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-slate-600">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No media assets yet. Upload or generate some!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateTab({ brand, assets, creatives, setCreatives }: { brand: BrandIdentity, assets: Asset[], creatives: Creative[], setCreatives: React.Dispatch<React.SetStateAction<Creative[]>>, key?: string }) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram_feed', 'instagram_story']);
  const [campaign, setCampaign] = useState({
    goal: 'Brand Awareness',
    offer: 'Free Consultation',
    cta: 'Book Now'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (selectedAssets.length === 0 || selectedPlatforms.length === 0) return;
    setIsGenerating(true);
    
    try {
      const tasks: any[] = [];
      const variationsPerAsset = 2; // Reduced from 3 to 2 for speed
      const totalTasks = selectedPlatforms.length * selectedAssets.length * variationsPerAsset;
      setProgress({ current: 0, total: totalTasks });

      const newCreatives: Creative[] = [];

      // Prepare all generation tasks
      for (const platform of selectedPlatforms) {
        for (const assetId of selectedAssets) {
          const asset = assets.find(a => a.id === assetId);
          if (!asset) continue;

          for (let i = 1; i <= variationsPerAsset; i++) {
            tasks.push({ platform, asset, version: i });
          }
        }
      }

      // Execute in small batches to avoid rate limits and browser hanging
      const batchSize = 3;
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async (task) => {
          try {
            const content = await generateCreativeContent(task.platform, campaign.goal, campaign.offer, campaign.cta, brand);
            
            let aspectRatio = '1:1';
            if (task.platform === 'instagram_story' || task.platform === 'tiktok') aspectRatio = '9:16';
            if (task.platform === 'web_banner') aspectRatio = '16:9';

            const creative: Creative = {
              id: Math.random().toString(36).substr(2, 9),
              platform: task.platform,
              mediaUrl: task.asset.url,
              headline: content.headline,
              body: content.body,
              cta: campaign.cta,
              aspectRatio,
              hashtags: content.hashtags,
              version: task.version,
              hook: content.hook,
              coreMessage: content.coreMessage,
              visualDirection: content.visualDirection,
              emotionalTrigger: content.emotionalTrigger,
              conversionMechanism: content.conversionMechanism
            };

            // Save to Backend
            await fetch('/api/creatives/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ businessId: 'events-made-easy', creative })
            });

            return creative;
          } catch (err) {
            console.error("Failed to generate creative", err);
            return null;
          }
        }));

        const successfulResults = results.filter(r => r !== null) as Creative[];
        newCreatives.push(...successfulResults);
        setProgress(prev => ({ ...prev, current: Math.min(prev.current + batch.length, totalTasks) }));
      }

      setCreatives(prev => [...prev, ...newCreatives]);
      alert(`Successfully generated ${newCreatives.length} ad creatives!`);
    } catch (e) {
      console.error(e);
      alert("An error occurred during generation. Please try again.");
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="space-y-12 max-w-7xl mx-auto"
    >
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-bold text-violet-400 uppercase tracking-widest">Ad Engineering</div>
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-white leading-none">Create Campaigns</h2>
        <p className="text-lg text-slate-400 max-w-2xl">Select your engineered assets and define your psychological triggers to generate high-converting ads.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Step 1: Asset Selection */}
        <div className="lg:col-span-8 space-y-10">
          <div className="glass-card p-10 rounded-[3rem] space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-xs font-black">01</div>
                Select Base Assets
              </h3>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedAssets.length} Selected</div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {assets?.map(asset => (
                <button 
                  key={asset.id}
                  onClick={() => selectedAssets.includes(asset.id) ? setSelectedAssets(selectedAssets.filter(id => id !== asset.id)) : setSelectedAssets([...selectedAssets, asset.id])}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${selectedAssets.includes(asset.id) ? 'border-violet-500 ring-4 ring-violet-500/20' : 'border-white/5 hover:border-white/20'}`}
                >
                  <img src={asset.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className={`absolute inset-0 bg-violet-600/20 transition-opacity ${selectedAssets.includes(asset.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  {selectedAssets.includes(asset.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="text-white w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
              {assets?.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <p className="text-slate-500 text-sm font-medium">No assets in library. Upload media first.</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-10 rounded-[3rem] space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-xs font-black">02</div>
              Campaign Framework
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Primary Goal</label>
                <select 
                  value={campaign.goal}
                  onChange={e => setCampaign({...campaign, goal: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none"
                >
                  <option className="bg-slate-900">Brand Awareness</option>
                  <option className="bg-slate-900">Lead Generation</option>
                  <option className="bg-slate-900">Direct Sales</option>
                  <option className="bg-slate-900">Event RSVP</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Core Offer</label>
                <input 
                  type="text" 
                  value={campaign.offer}
                  onChange={e => setCampaign({...campaign, offer: e.target.value})}
                  placeholder="e.g. 20% Off"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Call to Action</label>
                <select 
                  value={campaign.cta}
                  onChange={e => setCampaign({...campaign, cta: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none"
                >
                  <option className="bg-slate-900">Book Now</option>
                  <option className="bg-slate-900">Learn More</option>
                  <option className="bg-slate-900">Get Quote</option>
                  <option className="bg-slate-900">Sign Up</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Platforms & Generate */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-10 rounded-[3rem] space-y-8 sticky top-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-xs font-black">03</div>
              Target Platforms
            </h3>
            <div className="space-y-3">
              {[
                { id: 'instagram_feed', label: 'Instagram Feed', icon: <Instagram className="w-4 h-4" /> },
                { id: 'instagram_story', label: 'Instagram Story/Reel', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'facebook_feed', label: 'Facebook Feed', icon: <Facebook className="w-4 h-4" /> },
                { id: 'tiktok', label: 'TikTok', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'web_banner', label: 'Website Banner', icon: <ExternalLink className="w-4 h-4" /> }
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => handlePlatformToggle(p.id as Platform)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${selectedPlatforms.includes(p.id as Platform) ? 'bg-violet-600/10 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    {p.icon}
                    <span className="text-sm font-bold">{p.label}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlatforms.includes(p.id as Platform) ? 'bg-violet-600 border-violet-600' : 'border-white/10'}`}>
                    {selectedPlatforms.includes(p.id as Platform) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <button 
              disabled={selectedAssets.length === 0 || selectedPlatforms.length === 0 || isGenerating}
              onClick={handleGenerate}
              className="w-full py-6 bg-violet-600 hover:bg-violet-700 disabled:bg-white/5 disabled:text-slate-600 text-white font-black rounded-[2rem] shadow-2xl shadow-violet-500/40 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              {isGenerating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                  <span className="text-sm uppercase tracking-widest">Engineering Ads...</span>
                  {progress.total > 0 && <span className="text-[10px] opacity-60">{progress.current} / {progress.total} Variations</span>}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 group-hover:scale-125 transition-transform" /> 
                    <span className="text-lg uppercase tracking-tighter">Engineer Campaign</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Powered by Gemini 1.5 Pro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PlatformToggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
  return (
    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
        className="w-5 h-5 rounded-md border-white/10 bg-transparent text-violet-600 focus:ring-violet-500" 
      />
    </label>
  );
}

function LibraryTab({ creatives, schedule, setSchedule }: { creatives: Creative[], schedule: ScheduleItem[], setSchedule: React.Dispatch<React.SetStateAction<ScheduleItem[]>>, key?: string }) {
  const [view, setView] = useState<'grid' | 'calendar'>('grid');

  const handleSchedule = (creativeId: string) => {
    const creative = creatives.find(c => c.id === creativeId);
    if (!creative) return;

    // Simple logic: schedule for next available slot or just today + random hour
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + (schedule.length + 1) * 24 * 60 * 60 * 1000);
    scheduledDate.setHours(10 + (schedule.length % 8), 0, 0, 0);

    const newItem: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      creativeId,
      scheduledAt: scheduledDate.toISOString(),
      platform: creative.platform
    };

    setSchedule(prev => [...prev, newItem]);
    alert(`Scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleExportCSV = (platform: Platform | 'all') => {
    window.location.href = `/api/schedule/export.csv?businessId=events-made-easy&platform=${platform}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="space-y-12 max-w-7xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-bold text-violet-400 uppercase tracking-widest w-fit">Campaign Hub</div>
          <h2 className="text-5xl font-black tracking-tighter text-white leading-none">Library & Schedule</h2>
          <p className="text-lg text-slate-400">Manage your engineered creatives and deployment plan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-sm">
            <button 
              onClick={() => setView('grid')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'grid' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Library className="w-4 h-4 inline mr-2" /> Library
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'calendar' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Calendar className="w-4 h-4 inline mr-2" /> Schedule
            </button>
          </div>
        </div>
      </header>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {creatives?.map(creative => (
            <div key={creative.id} className="glass-card rounded-[2rem] overflow-hidden shadow-sm border border-white/10 flex flex-col group">
              <div className={`relative ${creative.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'} bg-slate-900`}>
                <img src={creative.mediaUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm text-slate-900">
                    {creative.platform.replace('_', ' ')}
                  </span>
                  {creative.emotionalTrigger && (
                    <span className="px-3 py-1 bg-violet-600/90 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm text-white">
                      {creative.emotionalTrigger}
                    </span>
                  )}
                </div>
                
                {/* Ad Overlay Simulation */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent text-white opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Hook</p>
                    <h4 className="text-lg font-bold leading-tight mb-1">{creative.hook || creative.headline}</h4>
                    <p className="text-xs opacity-80 line-clamp-2 mb-4">{creative.body}</p>
                    <button className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-lg uppercase tracking-widest">
                      {creative.cta}
                    </button>
                  </div>
                </div>

                {/* Psychological Context Overlay (Hover) */}
                <div className="absolute inset-0 p-6 bg-slate-900/95 flex flex-col justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Core Message</p>
                    <p className="text-xs text-white leading-relaxed">{creative.coreMessage}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Visual Direction</p>
                    <p className="text-xs text-slate-300 leading-relaxed italic">{creative.visualDirection}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Conversion Mechanism</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{creative.conversionMechanism}</p>
                  </div>
                  <div className="pt-2 flex flex-wrap gap-1">
                    {creative.hashtags?.map((tag, i) => (
                      <span key={i} className="text-[9px] text-slate-500">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between border-t border-white/5">
                <button className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  <Download className="w-3 h-3" /> Export
                </button>
                <button 
                  onClick={() => handleSchedule(creative.id)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-400 flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" /> Schedule
                </button>
              </div>
            </div>
          ))}
          {creatives?.length === 0 && (
            <div className="col-span-full py-32 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-slate-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No creatives generated yet. Head to the Create tab!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="glass-card p-10 rounded-[3rem] shadow-sm space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white tracking-tight">Weekly Deployment Plan</h3>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Timezone: UTC-8 (PST)
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest w-full mb-1">Export Platform CSVs</p>
                <button 
                  onClick={() => handleExportCSV('instagram_feed')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-2"
                >
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </button>
                <button 
                  onClick={() => handleExportCSV('tiktok')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-2"
                >
                  <Smartphone className="w-3.5 h-3.5" /> TikTok
                </button>
                <button 
                  onClick={() => handleExportCSV('facebook_feed')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-2"
                >
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </button>
                <button 
                  onClick={() => handleExportCSV('all')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> All (CSV)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const dayItems = schedule.filter(item => {
                const date = new Date(item.scheduledAt);
                // Simple mapping for demo: Mon=1, Tue=2... Sun=0
                const dayNum = date.getDay();
                const targetDayNum = (idx + 1) % 7;
                return dayNum === targetDayNum;
              });

              return (
                <div key={day} className="space-y-4">
                  <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">{day}</div>
                  <div className="min-h-[200px] bg-white/5 rounded-2xl border border-dashed border-white/10 p-2 flex flex-col gap-2">
                    {dayItems.map(item => {
                      const creative = creatives.find(c => c.id === item.creativeId);
                      const time = new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={item.id} className="p-2 bg-slate-800 rounded-xl shadow-sm border border-white/5 text-[10px] text-white">
                          <div className="font-bold text-violet-400 mb-1">{time}</div>
                          <div className="truncate opacity-70">{item.platform.replace('_', ' ').toUpperCase()}: {creative?.headline}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}


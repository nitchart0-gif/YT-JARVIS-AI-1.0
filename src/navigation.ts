import {
  LayoutDashboard,
  FileText,
  Clapperboard,
  Film,
  Search,
  Image as ImageIcon,
  Scissors,
  KeyRound,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavigationPageId =
  | 'overview'
  | 'sources'
  | 'scripts'
  | 'video-prompts'
  | 'seo-studio'
  | 'thumbnail-studio'
  | 'yt-editor'
  | 'api-keys'
  | 'settings';

export interface NavigationItem {
  id: NavigationPageId;
  label: string;
  badge?: string;
  description: string;
  icon: LucideIcon;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'YT-AI Creator Dashboard, pipeline overview, and studio status',
    icon: LayoutDashboard,
  },
  {
    id: 'sources',
    label: 'Sources',
    description: 'Saved articles, research notes, and plain text reference library',
    icon: FileText,
  },
  {
    id: 'scripts',
    label: 'Script Generator',
    description: 'Source-to-Video Script Generator with 12 modes & locked gemini-3.8-flash',
    badge: 'AI',
    icon: Clapperboard,
  },
  {
    id: 'video-prompts',
    label: 'Video Prompt Builder',
    description: 'Google Flow & Veo visual prompts mapped strictly to script segments',
    badge: 'Flow',
    icon: Film,
  },
  {
    id: 'seo-studio',
    label: 'SEO Studio',
    description: 'YouTube Titles, Description, Tags (<=500 chars), Keywords & Thumbnail Strategy',
    badge: 'SEO',
    icon: Search,
  },
  {
    id: 'thumbnail-studio',
    label: 'Thumbnail Studio',
    description: 'Cinematic 16:9 YouTube Thumbnails, Prompt Engineering & Live Studio Designer',
    badge: 'Studio',
    icon: ImageIcon,
  },
  {
    id: 'yt-editor',
    label: 'YT EDITOR',
    description: 'Professional non-linear video editing studio with timeline, multi-track, inspector & real export',
    badge: 'PRO',
    icon: Scissors,
  },
  {
    id: 'api-keys',
    label: 'API Configuration',
    description: 'Encrypted Gemini API key credentials and official developer portal links',
    icon: KeyRound,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Appearance presets, dark/light theme modes, and workspace preferences',
    icon: Settings,
  },
];


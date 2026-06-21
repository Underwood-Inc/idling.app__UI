import {
  Accessibility,
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Ban,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  Circle,
  CircleHelp,
  CircleX,
  Clapperboard,
  Coins,
  CreditCard,
  ClipboardList,
  Clock,
  Cloud,
  CloudFog,
  Construction,
  Copy,
  Crown,
  Database,
  Dices,
  Download,
  Eye,
  FilePlus,
  FileText,
  Flame,
  FlaskConical,
  Folder,
  FolderGit2,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  Hand,
  HardDrive,
  Hash,
  Home,
  Image,
  Infinity,
  Info,
  Key,
  LayoutTemplate,
  Library,
  Lightbulb,
  Link2,
  Loader2,
  Lock,
  LockKeyhole,
  LockOpen,
  Map,
  MapPin,
  Maximize2,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Monitor,
  MonitorPlay,
  MousePointerClick,
  Orbit,
  Package,
  Palette,
  Pause,
  PenLine,
  Pencil,
  Pin,
  PlusCircle,
  Radio,
  Rainbow,
  RefreshCw,
  Reply,
  Rocket,
  Save,
  Scissors,
  Search,
  Settings,
  Shield,
  Siren,
  Smartphone,
  Smile,
  Sparkles,
  Star,
  Target,
  Theater,
  Ticket,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Turtle,
  Tv2,
  Type,
  Unlink2,
  Upload,
  User,
  UserRoundSearch,
  Users,
  Video,
  Wand2,
  Wrench,
  X,
  Zap,
} from 'lucide';
import type { LucideIconComponent } from './lucideIcon.types';

/** Canonical Lucide icon ids for shared UI surfaces (stats, links, about, features). */
export type SiteIconId =
  | 'accessibility'
  | 'alertTriangle'
  | 'archive'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowUp'
  | 'arrowUpRight'
  | 'ban'
  | 'barChart'
  | 'bell'
  | 'bookOpen'
  | 'building'
  | 'calendar'
  | 'check'
  | 'circle'
  | 'circleHelp'
  | 'circleX'
  | 'clapperboard'
  | 'clipboard'
  | 'clock'
  | 'cloud'
  | 'cloudFog'
  | 'coins'
  | 'construction'
  | 'copy'
  | 'creditCard'
  | 'crown'
  | 'database'
  | 'dices'
  | 'download'
  | 'eye'
  | 'filePlus'
  | 'fileText'
  | 'flame'
  | 'flask'
  | 'folder'
  | 'folderGit'
  | 'gamepad'
  | 'gem'
  | 'gift'
  | 'globe'
  | 'hand'
  | 'hardDrive'
  | 'hash'
  | 'home'
  | 'image'
  | 'infinity'
  | 'info'
  | 'key'
  | 'layout'
  | 'library'
  | 'lightbulb'
  | 'link'
  | 'loader'
  | 'lock'
  | 'lockKeyhole'
  | 'lockOpen'
  | 'map'
  | 'mapPin'
  | 'maximize'
  | 'megaphone'
  | 'messageCircle'
  | 'messages'
  | 'monitor'
  | 'monitorPlay'
  | 'mousePointer'
  | 'orbit'
  | 'package'
  | 'palette'
  | 'pause'
  | 'pen'
  | 'pencil'
  | 'pin'
  | 'plusCircle'
  | 'radio'
  | 'rainbow'
  | 'refresh'
  | 'reply'
  | 'rocket'
  | 'save'
  | 'scissors'
  | 'search'
  | 'settings'
  | 'shield'
  | 'siren'
  | 'smartphone'
  | 'smile'
  | 'sparkles'
  | 'star'
  | 'target'
  | 'theater'
  | 'ticket'
  | 'trash'
  | 'trendingUp'
  | 'tv'
  | 'type'
  | 'turtle'
  | 'unlink'
  | 'upload'
  | 'user'
  | 'userSearch'
  | 'users'
  | 'video'
  | 'wand'
  | 'close'
  | 'wrench'
  | 'zap';

export interface SiteIconCatalogEntry {
  id: SiteIconId;
  icon: LucideIconComponent;
  label: string;
}

export const SITE_ICON_CATALOG: Record<SiteIconId, SiteIconCatalogEntry> = {
  accessibility: { id: 'accessibility', icon: Accessibility, label: 'Accessibility' },
  alertTriangle: { id: 'alertTriangle', icon: TriangleAlert, label: 'Warning' },
  archive: { id: 'archive', icon: Archive, label: 'Archive' },
  arrowDown: { id: 'arrowDown', icon: ArrowDown, label: 'Down' },
  arrowLeft: { id: 'arrowLeft', icon: ArrowLeft, label: 'Left' },
  arrowRight: { id: 'arrowRight', icon: ArrowRight, label: 'Right' },
  arrowUp: { id: 'arrowUp', icon: ArrowUp, label: 'Up' },
  arrowUpRight: { id: 'arrowUpRight', icon: ArrowUpRight, label: 'External link' },
  ban: { id: 'ban', icon: Ban, label: 'Blocked' },
  barChart: { id: 'barChart', icon: BarChart3, label: 'Analytics' },
  bell: { id: 'bell', icon: Bell, label: 'Notifications' },
  bookOpen: { id: 'bookOpen', icon: BookOpen, label: 'Documentation' },
  building: { id: 'building', icon: Building2, label: 'System overview' },
  calendar: { id: 'calendar', icon: Calendar, label: 'Calendar' },
  check: { id: 'check', icon: Check, label: 'Enabled' },
  circle: { id: 'circle', icon: Circle, label: 'Status indicator' },
  circleHelp: { id: 'circleHelp', icon: CircleHelp, label: 'Help' },
  circleX: { id: 'circleX', icon: CircleX, label: 'Error' },
  clapperboard: { id: 'clapperboard', icon: Clapperboard, label: 'Streaming' },
  clipboard: { id: 'clipboard', icon: ClipboardList, label: 'Clipboard' },
  clock: { id: 'clock', icon: Clock, label: 'Time' },
  cloud: { id: 'cloud', icon: Cloud, label: 'Cloud infrastructure' },
  cloudFog: { id: 'cloudFog', icon: CloudFog, label: 'Fog' },
  coins: { id: 'coins', icon: Coins, label: 'Revenue' },
  construction: { id: 'construction', icon: Construction, label: 'Architecture' },
  copy: { id: 'copy', icon: Copy, label: 'Copy' },
  creditCard: { id: 'creditCard', icon: CreditCard, label: 'Billing' },
  crown: { id: 'crown', icon: Crown, label: 'Crown' },
  database: { id: 'database', icon: Database, label: 'Database' },
  dices: { id: 'dices', icon: Dices, label: 'Randomize' },
  download: { id: 'download', icon: Download, label: 'Download' },
  eye: { id: 'eye', icon: Eye, label: 'View' },
  filePlus: { id: 'filePlus', icon: FilePlus, label: 'New' },
  fileText: { id: 'fileText', icon: FileText, label: 'Document' },
  flame: { id: 'flame', icon: Flame, label: 'Activity' },
  flask: { id: 'flask', icon: FlaskConical, label: 'Testing' },
  folder: { id: 'folder', icon: Folder, label: 'Categories' },
  folderGit: { id: 'folderGit', icon: FolderGit2, label: 'GitHub repository' },
  gamepad: { id: 'gamepad', icon: Gamepad2, label: 'Gaming' },
  gem: { id: 'gem', icon: Gem, label: 'Gem' },
  gift: { id: 'gift', icon: Gift, label: 'Gift' },
  globe: { id: 'globe', icon: Globe, label: 'Web' },
  hand: { id: 'hand', icon: Hand, label: 'Wave' },
  hardDrive: { id: 'hardDrive', icon: HardDrive, label: 'Storage' },
  hash: { id: 'hash', icon: Hash, label: 'Numbers' },
  home: { id: 'home', icon: Home, label: 'Home' },
  image: { id: 'image', icon: Image, label: 'Image' },
  infinity: { id: 'infinity', icon: Infinity, label: 'Infinite scroll' },
  info: { id: 'info', icon: Info, label: 'Information' },
  key: { id: 'key', icon: Key, label: 'Authentication' },
  layout: { id: 'layout', icon: LayoutTemplate, label: 'Layout' },
  library: { id: 'library', icon: Library, label: 'Library' },
  lightbulb: { id: 'lightbulb', icon: Lightbulb, label: 'Tip' },
  link: { id: 'link', icon: Link2, label: 'Link' },
  loader: { id: 'loader', icon: Loader2, label: 'Loading' },
  lock: { id: 'lock', icon: Lock, label: 'Locked' },
  lockKeyhole: { id: 'lockKeyhole', icon: LockKeyhole, label: 'Secure access' },
  lockOpen: { id: 'lockOpen', icon: LockOpen, label: 'Unlocked' },
  map: { id: 'map', icon: Map, label: 'Maps' },
  mapPin: { id: 'mapPin', icon: MapPin, label: 'Location' },
  maximize: { id: 'maximize', icon: Maximize2, label: 'Fullscreen radio visualizer' },
  megaphone: { id: 'megaphone', icon: Megaphone, label: 'Announcement' },
  messageCircle: { id: 'messageCircle', icon: MessageCircle, label: 'Discord' },
  messages: { id: 'messages', icon: MessagesSquare, label: 'Messages' },
  monitor: { id: 'monitor', icon: Monitor, label: 'Desktop' },
  monitorPlay: { id: 'monitorPlay', icon: MonitorPlay, label: 'Live stream' },
  mousePointer: { id: 'mousePointer', icon: MousePointerClick, label: 'Clicks' },
  orbit: { id: 'orbit', icon: Orbit, label: 'Galaxy' },
  package: { id: 'package', icon: Package, label: 'Package' },
  palette: { id: 'palette', icon: Palette, label: 'Design' },
  pause: { id: 'pause', icon: Pause, label: 'Pause' },
  pen: { id: 'pen', icon: PenLine, label: 'Compose' },
  pencil: { id: 'pencil', icon: Pencil, label: 'Edit' },
  pin: { id: 'pin', icon: Pin, label: 'Pin' },
  plusCircle: { id: 'plusCircle', icon: PlusCircle, label: 'Create new' },
  radio: { id: 'radio', icon: Radio, label: 'Radio' },
  rainbow: { id: 'rainbow', icon: Rainbow, label: 'Rainbow' },
  refresh: { id: 'refresh', icon: RefreshCw, label: 'Refresh' },
  reply: { id: 'reply', icon: Reply, label: 'Reply' },
  rocket: { id: 'rocket', icon: Rocket, label: 'Fast' },
  save: { id: 'save', icon: Save, label: 'Save' },
  scissors: { id: 'scissors', icon: Scissors, label: 'Shorten' },
  search: { id: 'search', icon: Search, label: 'Search' },
  settings: { id: 'settings', icon: Settings, label: 'Settings' },
  shield: { id: 'shield', icon: Shield, label: 'Security' },
  siren: { id: 'siren', icon: Siren, label: 'Alert' },
  smartphone: { id: 'smartphone', icon: Smartphone, label: 'Mobile app' },
  smile: { id: 'smile', icon: Smile, label: 'Emoji' },
  sparkles: { id: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  star: { id: 'star', icon: Star, label: 'Star' },
  target: { id: 'target', icon: Target, label: 'Target' },
  theater: { id: 'theater', icon: Theater, label: 'Role' },
  ticket: { id: 'ticket', icon: Ticket, label: 'Ticket' },
  trash: { id: 'trash', icon: Trash2, label: 'Delete' },
  trendingUp: { id: 'trendingUp', icon: TrendingUp, label: 'Trending up' },
  tv: { id: 'tv', icon: Tv2, label: 'Video' },
  type: { id: 'type', icon: Type, label: 'Typography' },
  turtle: { id: 'turtle', icon: Turtle, label: 'Slow' },
  unlink: { id: 'unlink', icon: Unlink2, label: 'Unlink' },
  upload: { id: 'upload', icon: Upload, label: 'Upload' },
  user: { id: 'user', icon: User, label: 'User' },
  userSearch: { id: 'userSearch', icon: UserRoundSearch, label: 'User search' },
  users: { id: 'users', icon: Users, label: 'Users' },
  video: { id: 'video', icon: Video, label: 'Video' },
  wand: { id: 'wand', icon: Wand2, label: 'Card generator' },
  close: { id: 'close', icon: X, label: 'Close' },
  wrench: { id: 'wrench', icon: Wrench, label: 'Tools' },
  zap: { id: 'zap', icon: Zap, label: 'Energy' },
};

export type AboutSectionIconId =
  | 'minecraft'
  | 'web-tools'
  | 'mappy'
  | 'streaming'
  | 'infrastructure';

export const ABOUT_SECTION_ICON_IDS: Record<AboutSectionIconId, SiteIconId> = {
  minecraft: 'gamepad',
  'web-tools': 'wrench',
  mappy: 'map',
  streaming: 'clapperboard',
  infrastructure: 'cloud',
};

export interface StatsQuickLinkDefinition {
  href: string;
  label: string;
  iconId: SiteIconId;
}

export const STATS_QUICK_LINKS: StatsQuickLinkDefinition[] = [
  { href: '/card-generator', label: 'Card Generator', iconId: 'wand' },
  { href: '/svg-converter', label: 'SVG Converter', iconId: 'palette' },
  { href: '/posts', label: 'Social Feed', iconId: 'messages' },
  { href: 'https://streamkit.idling.app', label: 'OBS Suite', iconId: 'monitorPlay' },
  { href: 'https://mods.idling.app', label: 'Mods Hub', iconId: 'gamepad' },
  { href: 'https://short.army/mappy', label: 'Mappy', iconId: 'map' },
  { href: 'https://auth.idling.app', label: 'Auth Service', iconId: 'key' },
  { href: 'https://docs.idling.app', label: 'Documentation', iconId: 'bookOpen' },
  { href: 'https://design.idling.app', label: 'Design System', iconId: 'palette' },
  { href: 'https://short.army', label: 'URL Shortener', iconId: 'link' },
  { href: 'https://access.idling.app', label: 'Access Hub', iconId: 'lockKeyhole' },
  { href: '/strixun-stream-suite', label: 'Stream Suite', iconId: 'zap' },
  {
    href: 'https://github.com/Underwood-Inc/strixun-stream-suite',
    label: 'Monorepo (38+)',
    iconId: 'folderGit',
  },
  {
    href: 'https://github.com/Underwood-Inc/idling.app__UI',
    label: 'idling.app Repo',
    iconId: 'folderGit',
  },
  { href: 'https://discord.gg/mpThbx67J7', label: 'Discord', iconId: 'messageCircle' },
];

export interface TechCategoryDefinition {
  title: string;
  iconId: SiteIconId;
  badges: string[];
}

export const STATS_TECH_CATEGORIES: TechCategoryDefinition[] = [
  {
    title: 'Frontend',
    iconId: 'palette',
    badges: ['React 19', 'Next.js 15', 'Svelte 5', 'TypeScript', 'Three.js'],
  },
  {
    title: 'Backend',
    iconId: 'settings',
    badges: ['Cloudflare Workers', 'Node.js', 'WebSocket', 'Go', 'Python'],
  },
  {
    title: 'Database',
    iconId: 'database',
    badges: ['PostgreSQL', 'KV Storage', 'R2 Cloud'],
  },
];

export interface EcosystemTabDefinition {
  id: 'overview' | 'dataflow' | 'packages';
  label: string;
  iconId: SiteIconId;
}

export const ECOSYSTEM_TABS: EcosystemTabDefinition[] = [
  { id: 'overview', label: 'System Overview', iconId: 'building' },
  { id: 'dataflow', label: 'Data Flow', iconId: 'refresh' },
  { id: 'packages', label: 'Package Ecosystem', iconId: 'package' },
];

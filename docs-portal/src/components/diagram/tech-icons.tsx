import {
  Activity,
  Bell,
  Box,
  Boxes,
  Braces,
  Brain,
  Car,
  Clock,
  Cloud,
  Cog,
  Container,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  File,
  FileCheck,
  FileCode,
  FlaskConical,
  Folder,
  Gauge,
  GitBranch,
  Globe,
  HardDrive,
  HeartPulse,
  Layers,
  LifeBuoy,
  ListChecks,
  Lock,
  Mail,
  Map,
  MessageSquare,
  Monitor,
  Network,
  Phone,
  Radio,
  Route,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Siren,
  Smartphone,
  Timer,
  User,
  Users,
  Wallet,
  Waypoints,
  Webhook,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type TechKey =
  | 'redis'
  | 'postgres'
  | 'nestjs'
  | 'expo'
  | 'opentelemetry'
  | 'supabase'
  | 'mapbox'
  | 'razorpay'
  | 'stripe'
  | 'twilio'
  | 'socketio'
  | 'reactnative'
  | 'typescript'
  | 'nodejs'
  | 'docker'
  | 'kubernetes'
  | 'bullmq'
  | 'aws'
  | 'queue'
  | 'database'
  | 'layers'
  | 'push'
  | 'security'
  | 'service'
  | 'controller'
  | 'gateway'
  | 'cache'
  | 'worker'
  | 'scheduler'
  | 'websocket'
  | 'api'
  | 'consumer'
  | 'captain'
  | 'admin'
  | 'user'
  | 'users'
  | 'map'
  | 'wallet'
  | 'money'
  | 'metrics'
  | 'alert'
  | 'sos'
  | 'ai'
  | 'file'
  | 'folder'
  | 'lock'
  | 'cloud'
  | 'storage'
  | 'network'
  | 'git'
  | 'timer'
  | 'mail'
  | 'phone'
  | 'health'
  | 'globe'
  | 'cpu'
  | 'box'
  | 'route'
  | 'dispatch'
  | 'search'
  | 'settings'
  | 'kyc'
  | 'twin'
  | 'support'
  | 'realtime'
  | 'webhook'
  | 'filter'
  | 'clock';

const REGISTRY: Record<TechKey, LucideIcon> = {
  redis: Boxes,
  postgres: Database,
  nestjs: Server,
  expo: Smartphone,
  opentelemetry: Activity,
  supabase: Brain,
  mapbox: Map,
  razorpay: CreditCard,
  stripe: CreditCard,
  twilio: MessageSquare,
  socketio: Radio,
  reactnative: Smartphone,
  typescript: FileCode,
  nodejs: Server,
  docker: Container,
  kubernetes: Boxes,
  bullmq: ListChecks,
  aws: Cloud,
  queue: ListChecks,
  database: Database,
  layers: Layers,
  push: Bell,
  security: ShieldCheck,
  service: Cog,
  controller: Waypoints,
  gateway: Network,
  cache: Zap,
  worker: Cpu,
  scheduler: Clock,
  websocket: Radio,
  api: Braces,
  consumer: User,
  captain: Car,
  admin: Monitor,
  user: User,
  users: Users,
  map: Map,
  wallet: Wallet,
  money: DollarSign,
  metrics: Gauge,
  alert: Siren,
  sos: Siren,
  ai: Brain,
  file: File,
  folder: Folder,
  lock: Lock,
  cloud: Cloud,
  storage: HardDrive,
  network: Network,
  git: GitBranch,
  timer: Timer,
  mail: Mail,
  phone: Phone,
  health: HeartPulse,
  globe: Globe,
  cpu: Cpu,
  box: Box,
  route: Route,
  dispatch: Waypoints,
  search: Search,
  settings: Settings,
  kyc: FileCheck,
  twin: FlaskConical,
  support: LifeBuoy,
  realtime: Radio,
  webhook: Webhook,
  filter: Activity,
  clock: Clock,
};

export function TechIcon({
  name,
  size = 17,
  className,
}: {
  name: TechKey;
  size?: number;
  className?: string;
}) {
  const Icon = REGISTRY[name];
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden />;
}

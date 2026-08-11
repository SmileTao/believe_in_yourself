import {
  Languages, Keyboard, Network, BookOpen, Dumbbell,
  Code, PenTool, Music, Heart, Coffee, CheckCircle, Target,
  type LucideIcon
} from 'lucide-react';

export const PLAN_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: 'Languages', icon: Languages, label: '英语' },
  { name: 'Keyboard', icon: Keyboard, label: '打字' },
  { name: 'Network', icon: Network, label: '网络' },
  { name: 'BookOpen', icon: BookOpen, label: '阅读' },
  { name: 'Dumbbell', icon: Dumbbell, label: '运动' },
  { name: 'Code', icon: Code, label: '编程' },
  { name: 'PenTool', icon: PenTool, label: '写作' },
  { name: 'Music', icon: Music, label: '音乐' },
  { name: 'Heart', icon: Heart, label: '健康' },
  { name: 'Coffee', icon: Coffee, label: '生活' },
  { name: 'CheckCircle', icon: CheckCircle, label: '通用' },
  { name: 'Target', icon: Target, label: '目标' }
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  PLAN_ICONS.map((i) => [i.name, i.icon])
);

const FALLBACK = CheckCircle;

export function getPlanIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? FALLBACK;
}

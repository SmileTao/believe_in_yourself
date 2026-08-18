import {
  CloudRain,
  Cloud,
  Meh,
  Smile,
  Laugh,
  Sparkles,
  type LucideIcon
} from 'lucide-react';

/**
 * 心情档位（可爱简约图标风，替代 emoji）。
 * 数值持久化到 journal_entries.mood（1-6），旧数据 1-5 兼容。
 */
export interface MoodOption {
  value: number;
  icon: LucideIcon;
  label: string;
  color: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, icon: CloudRain, label: '低落', color: '#F87171' },
  { value: 2, icon: Cloud, label: '疲惫', color: '#FB923C' },
  { value: 3, icon: Meh, label: '平稳', color: '#FBBF24' },
  { value: 4, icon: Smile, label: '不错', color: '#A3E635' },
  { value: 5, icon: Laugh, label: '开心', color: '#34D399' },
  { value: 6, icon: Sparkles, label: '闪耀', color: '#22D3EE' }
];

export function getMood(value: number | null | undefined): MoodOption | undefined {
  if (value == null) return undefined;
  return MOOD_OPTIONS.find((m) => m.value === value);
}

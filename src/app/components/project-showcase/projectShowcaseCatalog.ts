import {
  Building2,
  Gamepad2,
  LayoutGrid,
  MessageCircle,
  Pickaxe,
  Radio,
  Wrench,
} from 'lucide';
import type { LucideIconComponent } from '@molecules/lucide/lucideIcon.types';

export type ProjectShowcaseCategoryId =
  | 'All'
  | 'Minecraft'
  | 'Streaming'
  | 'Infrastructure'
  | 'Gaming'
  | 'Web Tools'
  | 'Social';

export interface ProjectShowcaseCategoryOption {
  id: ProjectShowcaseCategoryId;
  label: string;
  icon: LucideIconComponent;
}

export const PROJECT_SHOWCASE_CATEGORY_OPTIONS: ProjectShowcaseCategoryOption[] = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'Minecraft', label: 'Minecraft', icon: Pickaxe },
  { id: 'Web Tools', label: 'Web Tools', icon: Wrench },
  { id: 'Social', label: 'Social', icon: MessageCircle },
  { id: 'Streaming', label: 'Streaming', icon: Radio },
  { id: 'Gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'Infrastructure', label: 'Infrastructure', icon: Building2 },
];

export const PROJECT_SHOWCASE_TOTAL_COUNT = 38;

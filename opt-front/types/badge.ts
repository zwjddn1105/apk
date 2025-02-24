export type BadgeCategory = 
  | 'RUNNING'
  | 'WALKING'
  | 'CYCLING'
  | 'STRENGTH'
  | 'JUMPING_ROPE'
  | 'COMPREHENSIVE';

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  isUnlocked: boolean;
  requiredCount?: number;
  currentCount?: number;
  icon?: string; // 아이콘 이름 (예: MaterialCommunityIcons의 아이콘 이름)
  level: number; // 1: 입문, 2: 중급, 3: 고급
  createdAt: string;
}

export type BadgeProgress = {
  currentCount: number;
  requiredCount: number;
  percentage: number;
};

export interface BadgeWithProgress extends Badge {
  progress?: BadgeProgress;
}
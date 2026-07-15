import type { Model } from '@/lib/types';

export interface ProfileDetailsProps {
  model: Model;
  totalProjects: number;
  approvedCount: number;
  totalIncome: number;
  className?: string;
}

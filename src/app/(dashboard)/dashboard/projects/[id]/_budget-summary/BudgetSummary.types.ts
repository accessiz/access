import { Model, Project } from '@/lib/types';

export type BudgetSummaryCardProps = {
    project: Project;
    selectedModels: Model[];
    onRefresh?: () => void;
};

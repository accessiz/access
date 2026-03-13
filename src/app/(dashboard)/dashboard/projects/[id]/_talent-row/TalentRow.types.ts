import { Model, Project } from '@/lib/types';

export type TalentRowProps = {
    model: Model;
    project: Project;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
    onRefresh?: () => void;
    onAssignmentChange?: (modelId: string, scheduleId: string, assigned: boolean) => void;
    onPaymentChange?: (modelId: string, fee: number, feeType: string, currency: string) => void;
};

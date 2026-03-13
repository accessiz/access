import { Model, Project } from '@/lib/types';

export type PaymentEditorPopoverProps = {
    model: Model;
    project: Project;
    onRefresh?: () => void;
    onPaymentChange?: (modelId: string, fee: number, feeType: string, currency: string) => void;
};

import { Model, Project } from '@/lib/types';
import type { ModelPickerItem } from '@/lib/api/models';

type TalentRowModel = ModelPickerItem & {
    assignments?: Model['assignments'];
    client_selection?: Model['client_selection'];
    agreed_fee?: Model['agreed_fee'];
    trade_fee?: Model['trade_fee'];
    fee_type?: Model['fee_type'];
    currency?: Model['currency'];
};

export type TalentRowProps = {
    model: TalentRowModel;
    project: Project;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
    onRefresh?: () => void;
    onAssignmentChange?: (modelId: string, scheduleId: string, assigned: boolean) => void;
    onPaymentChange?: (modelId: string, fee: number, feeType: string, currency: string) => void;
};

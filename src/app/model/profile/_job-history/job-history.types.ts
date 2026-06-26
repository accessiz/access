export interface AppliedProjectSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string | null;
}

export interface AppliedProject {
  project_id: string;
  public_id?: string | null;
  project_name: string;
  client_name: string;
  location?: string | null;
  description?: string | null;
  currency: string;
  agreed_fee: number;
  trade_fee?: number | null;
  fee_type: string;
  client_selection: 'pending' | 'approved' | 'rejected';
  model_status: 'pending' | 'applied' | 'rejected' | null | string;
  model_available_schedules: string[] | null;
  application_deadline?: string | null;
  apply_end_at?: string | null;
  apply_start_at?: string | null;
  created_at: string;
  schedule: AppliedProjectSchedule[];
  assignments: any[];
  isPaid: boolean;
  status?: string | null;
  hide_schedule?: boolean | null;
}

export interface JobHistoryProps {
  projects: AppliedProject[];
  className?: string;
}

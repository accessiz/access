export interface AccessModelItem {
  id: string;
  full_name: string | null;
  alias: string | null;
  email: string | null;
  login_password?: string | null;
  country?: string | null;
  gender?: string | null;
}

export interface AccessTableProps {
  initialModels: AccessModelItem[];
}

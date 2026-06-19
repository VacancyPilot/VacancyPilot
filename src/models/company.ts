export interface Company {
  id: string;
  source: 'hh';
  sourceCompanyId?: string;
  name: string;
  url?: string;
  notes?: string;
  status: 'normal' | 'greylist' | 'blacklist';
  blacklistReason?: string;
  createdAt: string;
  updatedAt: string;
}

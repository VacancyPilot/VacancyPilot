export interface Resume {
  id: string;
  profileId: string;

  title: string;
  hhResumeId?: string;
  hhResumeUrl?: string;

  highlightsText: string;
  skills: string[];
  language: 'ru' | 'en' | 'ro';

  isDefault?: boolean;

  createdAt: string;
  updatedAt: string;
}

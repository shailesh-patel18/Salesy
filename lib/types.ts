export interface Lead {
  company: string;
  linkedin: string;
  name: string;
  title: string;
  employees: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  link: string;
}

export interface BatchResult extends Lead {
  personalized_message: string;
  processing_status: 'pending' | 'success' | 'error';
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'text' | 'csv';
}

export interface Client {
  id: string;
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  address?: string;
  occupation?: string;
  lastContact: Date;
  status: 'pending' | 'active' | 'inactive';
  portfolioValue: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  annualIncome?: number;
  investmentGoals?: string[];
  riskTolerance?: number;
  preferredContactMethod?: 'email' | 'phone' | 'mail';
}

export interface AIResponse {
  id: string;
  clientId: string;
  summary: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  category: 'tax-planning' | 'risk-planning' | 'estate-planning' | 'offshore-investment' | 'retirement-planning' | 'investment-planning' | 'general-enquiry';
  missingInfo: string[];
  responseType: 'email' | 'proposal';
}

export interface AIResponseRequest {
  clientId: string;
  category: AIResponse['category'];
  prompt: string;
  context: string;
  responseType: 'email' | 'proposal';
}

export interface PredefinedPrompt {
  id: string;
  category: AIResponse['category'];
  prompt: string;
  description: string;
  responseType: 'email' | 'proposal';
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: {
      name: string;
      value: string;
    }[];
    body: {
      data?: string;
    };
    parts?: {
      body: {
        data?: string;
      };
    }[];
  };
}

export interface Draft {
  id: string;
  message: {
    id: string;
    threadId: string;
  };
}

export interface ClientDocument {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface EmailAnalysis {
  id: string;
  client_id: string;
  created_at: string;
  raw_email: string;
  email_summary: string;
  sender_details: {
    name: string | null;
    email: string | null;
  };
  email_intent: {
    category: string;
    urgency: 'High' | 'Medium' | 'Low';
    action_required: boolean;
  };
  key_topics: string[];
  specific_questions: string[];
  attached_documents: string[];
  recommended_response: {
    tone: string;
    key_points: string[];
    suggested_actions: string[];
  };
}
export interface EmailAnalysis {
  email_summary: string;
  sender_details: {
    name: string | null;
    email: string | null;
    relationship: 'Client' | 'Prospect' | 'Institution' | 'Internal' | 'Other';
  };
  email_intent: {
    category: 'Inquiry' | 'Investment Consultation' | 'Tax Planning' | 'Portfolio Review' | 'Compliance' | 'Administrative Request' | 'Other';
    urgency: 'Low' | 'Medium' | 'High';
    action_required: boolean;
  };
  key_topics: string[];
  specific_questions: string[];
  attached_documents: {
    present: boolean;
    types: string[];
  };
  recommended_response: {
    summary: string;
    requires_manual_review: boolean;
    escalation_needed: boolean;
    assigned_department: 'Advisory' | 'Compliance' | 'Client Services' | 'Other';
  };
} 
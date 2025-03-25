// Types for email analysis
interface EmailAnalysis {
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

interface AIResponse {
  summary: string;
  emailResponse: string;
  category: string;
  missingInfo: string[];
}

/**
 * Analyzes an email and extracts key details relevant to financial advisory services
 * @param emailContent The content of the email to analyze
 * @returns Promise<EmailAnalysis> Structured analysis of the email
 */
export async function analyzeEmail(emailContent: string): Promise<EmailAnalysis> {
  try {
    console.log('analyzeEmail function called with content:', emailContent);
    console.log('Environment variables:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.MODE
    });

    const url = `${import.meta.env.VITE_API_URL}/api/analyze-email`;
    console.log('Making request to:', url);
    console.log('Request payload:', { emailContent });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to analyze email: ${response.status} - ${errorText}`);
    }

    const analysis = await response.json();
    console.log('Parsed analysis:', analysis);
    return analysis as EmailAnalysis;
  } catch (error) {
    console.error('Error analyzing email:', error);
    throw error;
  }
}

/**
 * Generates an AI response based on the provided prompt and context
 * @param prompt The prompt to generate a response for
 * @param clientContext Additional context for the response
 * @param responseType The type of response to generate
 * @returns Promise<AIResponse> The generated response
 */
export async function generateAIResponse(
  prompt: string,
  clientContext: string,
  responseType: 'email' | 'proposal' = 'email'
): Promise<AIResponse> {
  try {
    console.log('🤖 Starting AI response generation...');

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        clientContext,
        responseType
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      console.error('Server error:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Generated response successfully');
    return result;
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    throw error;
  }
}
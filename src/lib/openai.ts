// Types for email categorization
type EmailCategory = 
  | 'tax-planning'
  | 'risk-planning'
  | 'estate-planning'
  | 'offshore-investment'
  | 'retirement-planning'
  | 'investment-planning'
  | 'general-enquiry';

interface ClientData {
  name: string;
  email: string;
  portfolioValue: number;
  riskProfile: string;
  status: string;
  lastContact: Date;
}

interface AIResponse {
  summary: string;
  emailResponse: string;
  category: EmailCategory;
  missingInfo: string[];
}

// Function to analyze email content and determine category
async function analyzeEmailContent(emailContent: string): Promise<EmailCategory> {
  try {
    const response = await fetch('http://localhost:3000/api/analyze-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent,
        categories: [
          'tax-planning',
          'risk-planning',
          'estate-planning',
          'offshore-investment',
          'retirement-planning',
          'investment-planning',
          'general-enquiry'
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze email content');
    }

    const result = await response.json();
    return result.category as EmailCategory;
  } catch (error) {
    console.error('Error analyzing email:', error);
    return 'general-enquiry'; // Default category if analysis fails
  }
}

// Function to find appropriate prompt based on category
async function findAppropriatePrompt(category: EmailCategory): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/prompts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch prompts');
    }

    const prompts = await response.json();
    const matchingPrompt = prompts.find((p: any) => p.category === category);
    
    if (!matchingPrompt) {
      throw new Error(`No prompt found for category: ${category}`);
    }

    return matchingPrompt.prompt;
  } catch (error) {
    console.error('Error finding prompt:', error);
    throw error;
  }
}

// Main function to generate AI response
export async function generateAIResponse(
  prompt: string,
  clientContext: string,
  responseType: 'email' | 'proposal' = 'email'
): Promise<AIResponse> {
  try {
    console.log('🤖 Starting AI response generation...');

    // Generate response using the prompt and client context
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

// Function to generate client summary
export async function generateClientSummary(
  client: any,
  notes: any[],
  responses: any[],
  tasks: any[]
): Promise<string> {
  const clientData = {
    profile: {
      name: `${client.name} ${client.surname || ''}`.trim(),
      email: client.email,
      phone: client.phone,
      occupation: client.occupation,
      portfolioValue: client.portfolioValue,
      riskProfile: client.riskProfile,
      riskTolerance: client.riskTolerance,
      annualIncome: client.annualIncome,
      investmentGoals: client.investmentGoals,
      status: client.status,
      lastContact: client.lastContact,
    },
    notes: notes.map(note => ({
      content: note.content,
      date: note.created_at
    })),
    responses: responses.map(response => ({
      summary: response.summary,
      category: response.category,
      status: response.status,
      date: response.created_at
    })),
    tasks: tasks.map(task => ({
      title: task.title,
      status: task.status,
      dueDate: task.due_date
    }))
  };

  return generateAIResponse(
    'Generate a comprehensive client summary',
    JSON.stringify(clientData, null, 2),
    clientData.profile
  ).then(response => response.emailResponse);
}
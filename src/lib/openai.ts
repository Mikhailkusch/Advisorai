import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    'OpenAI API key is missing. Please add VITE_OPENAI_API_KEY to your .env file.'
  );
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from a backend server
});

interface ClientData {
  name: string;
  email: string;
  portfolioValue: number;
  riskProfile: string;
  status: string;
  lastContact: Date;
}

// Helper function to generate AI responses
export async function generateAIResponse(
  prompt: string,
  clientContext: string,
  responseType: 'email' | 'proposal' = 'email'
): Promise<{
  summary: string;
  emailResponse: string;
  category: string;
  missingInfo: string[];
}> {
  try {
    console.log('🤖 Generating AI response...');

    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
    console.log('✅ Server response:', result);
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
  try {
    const systemPrompt = `You are a professional financial advisor assistant. Create a comprehensive summary of the client's profile, communication history, and current status. Focus on key insights and actionable information.`;

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

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please provide a comprehensive summary for this client based on the following data:\n${JSON.stringify(clientData, null, 2)}`
        }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000
    });

    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      throw new Error('No summary generated');
    }

    return summary;
  } catch (error) {
    console.error('Error generating client summary:', error);
    throw new Error('Failed to generate client summary');
  }
}
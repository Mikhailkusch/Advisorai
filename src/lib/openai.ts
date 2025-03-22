// Remove the direct OpenAI initialization
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

    const response = await fetch('/.netlify/functions/generate', {
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
    'email'
  ).then(response => response.emailResponse);
}
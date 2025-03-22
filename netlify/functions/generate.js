import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt, clientContext, responseType = 'email' } = JSON.parse(event.body);

    // Construct the system prompt based on response type
    const systemPrompt = responseType === 'email' 
      ? `You are a professional financial advisor assistant. Provide clear, compliant financial advice while maintaining a professional tone.`
      : `You are a professional financial advisor assistant. Create detailed investment proposals while maintaining a professional tone.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `${prompt}\n\nContext: ${clientContext}`
        }
      ],
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: responseType === 'email' ? 2000 : 4000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No response generated' })
      };
    }

    // Parse the response into sections
    const sections = response.split('\n\n');
    const result = {
      summary: '',
      emailResponse: '',
      category: 'general-advice',
      missingInfo: []
    };

    sections.forEach(section => {
      if (section.startsWith('Summary:')) {
        result.summary = section.replace('Summary:', '').trim();
      } else if (section.startsWith('Email Response:') || section.startsWith('Proposal:')) {
        result.emailResponse = section
          .replace('Email Response:', '')
          .replace('Proposal:', '')
          .trim();
      } else if (section.startsWith('Category:')) {
        result.category = section.replace('Category:', '').trim();
      } else if (section.startsWith('Missing Information:')) {
        result.missingInfo = section
          .replace('Missing Information:', '')
          .trim()
          .split('\n')
          .map(item => item.trim())
          .filter(Boolean);
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate response' })
    };
  }
}; 
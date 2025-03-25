import type { EmailAnalysis } from '../types';

export async function analyzeEmailContent(content: string): Promise<EmailAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      prompt: `Instruction: Analyze the following email and extract key details relevant to financial advisory services...` // Your full prompt here
    }),
  });

  if (!response.ok) {
    throw new Error('Analysis failed');
  }

  return response.json();
} 
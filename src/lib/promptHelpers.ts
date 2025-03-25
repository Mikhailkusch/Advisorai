import { supabase } from './supabase';
import Handlebars from 'handlebars';

interface AdvisorData {
  first_name: string;
  last_name: string;
  company: string;
}

export async function getPopulatedAnalysisResponsePrompt(
  emailAnalysisId: string,
  advisorData: AdvisorData
): Promise<string> {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Failed to get session');
    }
    if (!session) {
      console.error('No active session');
      throw new Error('No active session');
    }

    // Ensure we have a valid access token
    if (!session.access_token) {
      console.error('No access token in session');
      throw new Error('No access token available');
    }

    console.log('Making request with token:', session.access_token.substring(0, 10) + '...');

    const response = await fetch('http://localhost:3000/api/prompts/populate-analysis-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token.trim()}`
      },
      body: JSON.stringify({
        emailAnalysisId,
        advisorData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error:', errorData);
      throw new Error(errorData.error || 'Failed to populate prompt');
    }

    const { populatedPrompt } = await response.json();
    return populatedPrompt;
  } catch (error) {
    console.error('Error populating analysis response prompt:', error);
    throw error;
  }
} 
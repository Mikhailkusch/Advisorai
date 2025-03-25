import express from 'express';
import Handlebars from 'handlebars';
import analysisResponsePrompt from '../prompts/analysisResponsePrompt.js';

const router = express.Router();

router.post('/populate-analysis-response', async (req, res) => {
  try {
    const { emailAnalysisId, advisorData } = req.body;
    const supabase = req.app.locals.supabase; // Get Supabase client from app locals

    // Fetch email analysis data
    const { data: emailAnalysis, error: analysisError } = await supabase
      .from('email_analyses')
      .select('*, client_id')
      .eq('id', emailAnalysisId)
      .single();

    if (analysisError) throw analysisError;
    if (!emailAnalysis) throw new Error('Email analysis not found');

    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', emailAnalysis.client_id)
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error('Client not found');

    // Fetch client documents
    const { data: clientDocuments, error: documentsError } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', emailAnalysis.client_id);

    if (documentsError) throw documentsError;

    // Fetch client notes
    const { data: clientNotes, error: notesError } = await supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', emailAnalysis.client_id)
      .order('created_at', { ascending: false });

    if (notesError) throw notesError;

    // Fetch client tasks
    const { data: clientTasks, error: tasksError } = await supabase
      .from('client_tasks')
      .select('*')
      .eq('client_id', emailAnalysis.client_id)
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    // Transform data to match template expectations
    const transformedData = {
      advisor: advisorData,
      emailAnalysis: {
        email_summary: emailAnalysis.email_summary || '',
        email_intent: emailAnalysis.email_intent?.category || '',
        key_topics: Array.isArray(emailAnalysis.key_topics) ? emailAnalysis.key_topics.join(', ') : '',
        specific_questions: Array.isArray(emailAnalysis.specific_questions) ? emailAnalysis.specific_questions.join(', ') : '',
        raw_email: emailAnalysis.raw_email || ''
      },
      client: {
        name: client.name,
        surname: client.surname || '',
        email: client.email,
        status: client.status,
        portfolioValue: client.portfolio_value,
        riskProfile: client.risk_profile,
        lastContact: client.last_contact
      },
      clientDocuments: (clientDocuments || []).map(doc => ({
        title: doc.name,
        type: doc.file_type,
        description: `File size: ${doc.file_size} bytes`
      })),
      clientNotes: (clientNotes || []).map(note => ({
        content: note.content,
        created_at: new Date(note.created_at).toLocaleDateString()
      })),
      clientTasks: (clientTasks || []).map(task => ({
        title: task.title,
        status: task.status
      }))
    };

    // Compile template with Handlebars
    const template = Handlebars.compile(analysisResponsePrompt);

    // Populate template with data
    const populatedPrompt = template(transformedData);

    res.json({ populatedPrompt });
  } catch (error) {
    console.error('Error populating analysis response prompt:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      code: error.code,
      details: error.details
    });

    // Handle JWT errors specifically
    if (error.code === 'PGRST301') {
      return res.status(401).json({ 
        error: 'Invalid authentication token',
        details: 'The provided JWT token is malformed or invalid'
      });
    }

    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

export default router; 
import express from 'express';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Gmail API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.settings.basic'
];

// Configure trust proxy
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:5174', 
    'http://127.0.0.1:5175', 
    'http://127.0.0.1:5176',
    process.env.VITE_APP_URL, // Netlify deployment URL
    'https://*.netlify.app'    // All Netlify preview deployments
  ].filter(Boolean),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 
           req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           'unknown';
  }
});

// Apply rate limiting to all routes
app.use(limiter);

// Session configuration with secure settings
app.use(session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Store tokens in memory (use a proper database in production)
const tokenStore = new Map();
const watchStore = new Map();

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/gmail/callback'
);

// Auth status endpoint
app.get('/api/auth-status', (req, res) => {
  const userId = req.session.userId;
  const isAuthenticated = userId && tokenStore.has(userId);
  res.json({ authenticated: isAuthenticated });
});

// Initialize auth endpoint
app.post('/api/auth/initialize', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: crypto.randomBytes(16).toString('hex')
    });
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initializing auth:', error);
    res.status(500).json({ error: 'Failed to initialize authentication' });
  }
});

// Gmail auth endpoint
app.get('/api/auth/gmail', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// OAuth callback handler
app.get('/api/auth/gmail/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.send(`
      <script>
        window.opener.postMessage({ 
          type: 'gmail-auth-complete', 
          success: false, 
          error: 'No authorization code received' 
        }, '*');
        window.close();
      </script>
    `);
  }

  try {
    // Get tokens from code
    const { tokens } = await oauth2Client.getToken(code);
    const userId = crypto.randomBytes(16).toString('hex');
    
    // Store tokens and user ID
    tokenStore.set(userId, tokens);
    req.session.userId = userId;

    // Create a new OAuth2 client instance for this user
    const userOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/gmail/callback'
    );
    
    // Set credentials for this instance
    userOAuth2Client.setCredentials(tokens);
    
    // Initialize Gmail API with the user's OAuth2 client
    const gmail = google.gmail({ version: 'v1', auth: userOAuth2Client });
    
    try {
      // Test the connection by getting user profile
      const profile = await gmail.users.getProfile({ userId: 'me' });
      console.log('Successfully authenticated for email:', profile.data.emailAddress);
      
      res.send(`
        <script>
          window.opener.postMessage({ 
            type: 'gmail-auth-complete', 
            success: true 
          }, '*');
          window.close();
        </script>
      `);
    } catch (apiError) {
      console.error('Gmail API error:', apiError);
      throw new Error('Failed to access Gmail API');
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.send(`
      <script>
        window.opener.postMessage({ 
          type: 'gmail-auth-complete', 
          success: false, 
          error: '${error.message}' 
        }, '*');
        window.close();
      </script>
    `);
  }
});

// Fetch emails endpoint
app.get('/api/emails', async (req, res) => {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tokens = tokenStore.get(userId);
  if (!tokens) {
    return res.status(401).json({ error: 'No tokens found' });
  }

  try {
    // Create a new OAuth2 client for this request
    const userOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/gmail/callback'
    );
    
    // Set the tokens
    userOAuth2Client.setCredentials(tokens);
    
    // Initialize Gmail API with the user's OAuth2 client
    const gmail = google.gmail({ version: 'v1', auth: userOAuth2Client });
    
    // Get messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Create draft endpoint
app.post('/api/drafts', async (req, res) => {
  const userId = req.session.userId;
  if (!userId || !tokenStore.has(userId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { messageId, content } = req.body;

  try {
    oauth2Client.setCredentials(tokenStore.get(userId));
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get the original message to extract headers
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const headers = originalMessage.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const to = headers.find(h => h.name === 'From')?.value || '';
    
    // Create the draft email
    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      '',
      content
    ].join('\r\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedEmail,
          threadId: originalMessage.data.threadId
        }
      }
    });

    res.json(draft.data);
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ error: 'Failed to create draft' });
  }
});

// Generate AI Response endpoint
app.post('/api/generate', async (req, res) => {
  try {
    console.log('Received generate request:', req.body);
    const { prompt, clientContext, responseType = 'email' } = req.body;

    if (!prompt || !clientContext) {
      console.error('Missing required parameters:', { prompt, clientContext });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Parse client context into structured data
    const clientData = {};
    clientContext.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        switch (key) {
          case 'Client Name':
            clientData.name = value;
            break;
          case 'Risk Profile':
            clientData.riskProfile = value;
            break;
          case 'Portfolio Value':
            clientData.portfolioValue = parseFloat(value.replace(/[R$,]/g, ''));
            break;
          case 'Additional Context':
            clientData.additionalContext = value;
            break;
        }
      }
    });

    console.log('Parsed client data:', clientData);

    // Create structured client data JSON
    const structuredClientData = JSON.stringify(clientData, null, 2);

    // Construct the system prompt based on response type
    const systemPrompt = responseType === 'email' 
      ? `You are a professional financial advisor assistant. Provide clear, compliant financial advice while maintaining a professional tone.

IMPORTANT: Your response MUST follow this EXACT format, with each section starting on a new line:

Summary:
[Write a brief 2-3 sentence summary of the key points]

Email Response:
[Write your detailed email response here]

Category:
[Choose exactly one: investment-update, tax-planning, general-advice, or onboarding]

Missing Information:
[If any information is missing, list it here, one item per line]

Example format:
Summary:
This response addresses the client's questions about tax planning for their investment portfolio.

Email Response:
Dear [Client Name],

Thank you for your inquiry about tax planning...

Category:
tax-planning

Missing Information:
- Current tax bracket
- Specific investment holdings`
      : `You are a professional financial advisor assistant. Create detailed investment proposals while maintaining a professional tone.

IMPORTANT: Your response MUST follow this EXACT format, with each section starting on a new line:

Summary:
[Write a brief 2-3 sentence executive summary]

Proposal:
[Write your detailed proposal here]

Category:
[Choose exactly one: investment-update, tax-planning, general-advice, or onboarding]

Missing Information:
[If any information is missing, list it here, one item per line]

Example format:
Summary:
This proposal outlines a comprehensive investment strategy for the client's retirement portfolio.

Proposal:
Based on your current financial situation...

Category:
investment-update

Missing Information:
- Current investment portfolio details
- Retirement timeline`;

    // Construct the complete prompt
    const completePrompt = `
Client Data:
${structuredClientData}

Master Prompt:
${prompt}

Additional Context:
${clientData.additionalContext || ''}

Please provide a ${responseType === 'email' ? 'professional email response' : 'detailed investment proposal'} based on the above information.`;

    console.log('Sending request to OpenAI with prompt:', completePrompt);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: completePrompt
        }
      ],
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 4000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response generated from OpenAI');
      return res.status(500).json({ error: 'No response generated from OpenAI' });
    }

    console.log('Raw GPT Response:', response);
    console.log('Response sections:', response.split(/(?=^Summary:|^Email Response:|^Proposal:|^Category:|^Missing Information:)/m));

    // Parse the response
    const result = {
      summary: '',
      emailResponse: '',
      category: 'general-advice',
      missingInfo: []
    };

    // Split by sections but preserve newlines within sections
    const sections = response.split(/(?=^Summary:|^Email Response:|^Proposal:|^Category:|^Missing Information:)/m);

    for (const section of sections) {
      const trimmedSection = section.trim();
      console.log('Processing section:', trimmedSection.substring(0, 50) + '...');
      
      if (trimmedSection.startsWith('Summary:')) {
        result.summary = trimmedSection
          .replace('Summary:', '')
          .replace(/^\s+|\s+$/g, '')
          .replace(/\n+/g, ' ');
        console.log('Found summary:', result.summary);
      } else if (trimmedSection.startsWith('Email Response:') || trimmedSection.startsWith('Proposal:')) {
        result.emailResponse = trimmedSection
          .replace(/^(Email Response:|Proposal:)/, '')
          .replace(/^\s+|\s+$/g, '');
        console.log('Found email/proposal response');
      } else if (trimmedSection.startsWith('Category:')) {
        const category = trimmedSection
          .replace('Category:', '')
          .replace(/^\s+|\s+$/g, '')
          .toLowerCase();
        if (['investment-update', 'tax-planning', 'general-advice', 'onboarding'].includes(category)) {
          result.category = category;
          console.log('Found category:', result.category);
        }
      } else if (trimmedSection.startsWith('Missing Information:')) {
        result.missingInfo = trimmedSection
          .replace('Missing Information:', '')
          .split('\n')
          .map(item => item.trim())
          .filter(item => item.length > 0 && !item.startsWith('-'))
          .map(item => item.replace(/^-\s*/, ''));
        console.log('Found missing info:', result.missingInfo);
      }
    }

    // Validate the result
    if (!result.summary || !result.emailResponse) {
      console.error('Missing required sections in response');
      return res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }

    console.log('Final parsed result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response', details: error.message });
  }
});

// Function to generate client summary
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { client, notes, responses, tasks } = req.body;

    if (!client || !client.id) {
      return res.status(400).json({ error: 'Invalid client data' });
    }

    // Validate and sanitize input data
    const sanitizedNotes = Array.isArray(notes) ? notes.slice(0, 10) : [];
    const sanitizedResponses = Array.isArray(responses) ? responses.slice(0, 5) : [];
    const sanitizedTasks = Array.isArray(tasks) ? tasks.slice(0, 5) : [];

    const systemPrompt = `You are a professional financial advisor assistant creating a comprehensive client summary. Follow these guidelines:

1. Information Weighting:
   - Notes and recent communications (context) carry the highest weight
   - Dynamic information (recent portfolio changes, life events) is more relevant than static data
   - Historical context should inform but not dominate the summary

2. Use the following Markdown formatting:
   - Use # for main sections (e.g., # Financial Overview)
   - Use ## for subsections (e.g., ## Investment Strategy)
   - Use ** for important highlights (e.g., **High Risk Tolerance**)
   - Use - for bullet points in lists
   - Use > for important quotes or notes

3. Structure the summary with these sections:
   # Client Overview
   (Key personal and financial information)
   
   ## Current Financial Situation
   (Portfolio value, investment holdings, risk profile)
   
   ## Family & Lifestyle
   (Age, marital status, children, lifestyle factors affecting financial planning)
   
   ## Recent Developments
   (Latest notes, communications, and significant changes)
   
   ## Action Items & Recommendations
   (Based on recent communications and notes)

4. Highlight any red flags or immediate action items that require attention.`;

    const clientData = {
      profile: {
        name: `${client.name} ${client.surname || ''}`.trim(),
        email: client.email,
        phone: client.phone,
        age: client.age,
        occupation: client.occupation,
        maritalStatus: client.maritalStatus,
        hasChildren: client.hasChildren,
        numberOfChildren: client.numberOfChildren,
        portfolioValue: client.portfolioValue,
        investmentHoldings: client.investmentHoldings,
        riskProfile: client.riskProfile,
        riskTolerance: client.riskTolerance,
        annualIncome: client.annualIncome,
        investmentGoals: client.investmentGoals,
        retirementAge: client.retirementAge,
        status: client.status,
        lastContact: client.lastContact,
      },
      notes: sanitizedNotes
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(note => ({
          content: note.content,
          date: note.created_at,
          priority: 'high'
        })),
      responses: sanitizedResponses
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(response => ({
          summary: response.summary,
          content: response.content,
          context: response.context,
          category: response.category,
          status: response.status,
          date: response.created_at,
          priority: 'high'
        })),
      tasks: sanitizedTasks
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(task => ({
          title: task.title,
          status: task.status,
          dueDate: task.due_date,
          priority: task.priority
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
          content: `Generate a comprehensive client summary using markdown formatting. Focus on recent notes and communications while incorporating relevant static information. Use the following data:\n${JSON.stringify(clientData, null, 2)}`
        }
      ],
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 2000
    });

    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      throw new Error('No summary generated');
    }

    res.json({ summary });
  } catch (error) {
    console.error('Error generating client summary:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate client summary'
    });
  }
});

// Email Analysis endpoint
app.post('/api/analyze-email', async (req, res) => {
  try {
    const { emailContent, categories } = req.body;

    if (!emailContent || !categories) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const systemPrompt = `You are an expert financial advisor assistant. Analyze the following email content and categorize it into one of the provided categories. Choose the most appropriate category based on the main topic and intent of the email.

Available categories:
${categories.map(cat => `- ${cat.replace(/-/g, ' ')}`).join('\n')}

Respond with ONLY the category name, nothing else.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: emailContent
        }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      max_tokens: 50
    });

    const category = completion.choices[0]?.message?.content?.trim().toLowerCase();
    
    if (!category || !categories.includes(category)) {
      return res.status(500).json({ error: 'Failed to determine valid category' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Error analyzing email:', error);
    res.status(500).json({ error: 'Failed to analyze email content' });
  }
});

// Prompts endpoint
app.get('/api/prompts', async (req, res) => {
  try {
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*');

    if (error) throw error;
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server shutting down');
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAIResponse, generateClientSummary } from '../openai';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenAI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAIResponse', () => {
    const mockClientData = {
      name: 'John Doe',
      email: 'john@example.com',
      portfolioValue: 1000000,
      riskProfile: 'Moderate',
      status: 'Active',
      lastContact: new Date()
    };

    const mockEmailContent = 'I would like to discuss tax planning strategies for my portfolio.';
    const mockClientContext = 'Client has shown interest in tax optimization.';

    it('should successfully analyze email and generate response', async () => {
      // Mock the analyze-email endpoint response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ category: 'tax-planning' })
        })
        // Mock the prompts endpoint response
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([
            {
              category: 'tax-planning',
              prompt: 'Provide tax optimization strategies',
              description: 'Tax Planning Strategy',
              response_type: 'email'
            }
          ])
        })
        // Mock the generate endpoint response
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            summary: 'Tax planning consultation summary',
            emailResponse: 'Here are your tax planning recommendations...',
            category: 'tax-planning',
            missingInfo: ['Current tax bracket']
          })
        });

      const result = await generateAIResponse(mockEmailContent, mockClientContext, mockClientData);

      expect(result).toEqual({
        summary: 'Tax planning consultation summary',
        emailResponse: 'Here are your tax planning recommendations...',
        category: 'tax-planning',
        missingInfo: ['Current tax bracket']
      });

      // Verify API calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle email analysis failure gracefully', async () => {
      // Mock the analyze-email endpoint failure
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Analysis failed' })
        });

      const result = await generateAIResponse(mockEmailContent, mockClientContext, mockClientData);

      // Should default to 'general-enquiry' category on failure
      expect(result.category).toBe('general-enquiry');
    });

    it('should handle prompt fetching failure', async () => {
      // Mock successful email analysis but failed prompt fetch
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ category: 'tax-planning' })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to fetch prompts' })
        });

      await expect(generateAIResponse(mockEmailContent, mockClientContext, mockClientData))
        .rejects
        .toThrow('Failed to fetch prompts');
    });
  });

  describe('generateClientSummary', () => {
    const mockClient = {
      name: 'John',
      surname: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      occupation: 'Engineer',
      portfolioValue: 1000000,
      riskProfile: 'Moderate',
      riskTolerance: 'Medium',
      annualIncome: 150000,
      investmentGoals: 'Retirement',
      status: 'Active',
      lastContact: new Date()
    };

    const mockNotes = [
      { content: 'Client interested in tax planning', created_at: new Date() }
    ];

    const mockResponses = [
      {
        summary: 'Tax planning discussion',
        category: 'tax-planning',
        status: 'completed',
        created_at: new Date()
      }
    ];

    const mockTasks = [
      {
        title: 'Review tax strategy',
        status: 'pending',
        due_date: new Date()
      }
    ];

    it('should generate a comprehensive client summary', async () => {
      // Mock the generate endpoint response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            summary: 'Client overview summary',
            emailResponse: 'Detailed client summary...',
            category: 'general-enquiry',
            missingInfo: []
          })
        });

      const result = await generateClientSummary(mockClient, mockNotes, mockResponses, mockTasks);

      expect(result).toBe('Detailed client summary...');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle summary generation failure', async () => {
      // Mock the generate endpoint failure
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to generate summary' })
        });

      await expect(generateClientSummary(mockClient, mockNotes, mockResponses, mockTasks))
        .rejects
        .toThrow('Failed to generate summary');
    });
  });
}); 
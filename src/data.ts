import { Client, AIResponse, PredefinedPrompt } from './types';

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    lastContact: new Date('2024-03-10'),
    status: 'active',
    portfolioValue: 750000,
    riskProfile: 'moderate'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    lastContact: new Date('2024-03-08'),
    status: 'active',
    portfolioValue: 1250000,
    riskProfile: 'aggressive'
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma.w@example.com',
    lastContact: new Date('2024-03-01'),
    status: 'pending',
    portfolioValue: 500000,
    riskProfile: 'conservative'
  }
];

export const predefinedPrompts: PredefinedPrompt[] = [
  {
    id: '1',
    category: 'investment-update',
    prompt: 'Based on the client\'s risk profile and current market conditions, provide a detailed portfolio rebalancing recommendation.',
    description: 'Portfolio Rebalancing'
  },
  {
    id: '2',
    category: 'tax-planning',
    prompt: 'Review the client\'s portfolio and suggest tax optimization strategies for the current financial year.',
    description: 'Tax Optimization'
  },
  {
    id: '3',
    category: 'general-advice',
    prompt: 'Analyze the client\'s current portfolio allocation and provide recommendations for improving diversification.',
    description: 'Portfolio Diversification'
  },
  {
    id: '4',
    category: 'onboarding',
    prompt: 'Create a comprehensive welcome message and initial investment strategy based on the client\'s risk profile and portfolio value.',
    description: 'Welcome Strategy'
  }
];

export const mockResponses: AIResponse[] = [
  {
    id: '1',
    clientId: '1',
    subject: 'Portfolio Rebalancing Recommendation',
    content: 'Based on recent market movements, I recommend adjusting your portfolio allocation to maintain your target risk profile. The proposed changes include increasing your bond exposure by 5% and reducing emerging market exposure by a corresponding amount.',
    status: 'pending',
    createdAt: new Date('2024-03-11'),
    category: 'investment-update'
  },
  {
    id: '2',
    clientId: '2',
    subject: 'Tax Planning Strategy',
    content: "Given your current investment structure, there are several tax optimization opportunities we should discuss. I've identified potential tax savings through strategic reallocation of your offshore investments.",
    status: 'approved',
    createdAt: new Date('2024-03-10'),
    category: 'tax-planning'
  },
  {
    id: '3',
    clientId: '3',
    subject: 'Welcome and Investment Strategy',
    content: 'Thank you for choosing our services. Based on our initial discussion and your risk assessment, I\'ve prepared a comprehensive investment strategy that aligns with your conservative risk profile and long-term goals.',
    status: 'pending',
    createdAt: new Date('2024-03-09'),
    category: 'onboarding'
  }
];
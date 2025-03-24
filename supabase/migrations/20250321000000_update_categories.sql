/*
  # Update prompts table with new categories

  1. Changes
    - Update the category check constraint to include new categories
    - Add new default prompts for each category
*/

-- Update the category check constraint
ALTER TABLE prompts
DROP CONSTRAINT IF EXISTS prompts_category_check;

ALTER TABLE prompts
ADD CONSTRAINT prompts_category_check CHECK (
  category IN (
    'tax-planning',
    'risk-planning',
    'estate-planning',
    'offshore-investment',
    'retirement-planning',
    'investment-planning',
    'general-enquiry'
  )
);

-- Insert default prompts for each category
INSERT INTO prompts (category, prompt, description, response_type)
VALUES
  ('tax-planning', 'Based on the client''s current tax situation and portfolio, provide tax optimization strategies and recommendations for the current financial year.', 'Tax Planning Strategy', 'email'),
  ('risk-planning', 'Analyze the client''s current risk exposure and provide recommendations for risk management and mitigation strategies.', 'Risk Management Plan', 'email'),
  ('estate-planning', 'Review the client''s estate planning needs and provide recommendations for wealth transfer and legacy planning.', 'Estate Planning Review', 'email'),
  ('offshore-investment', 'Evaluate the client''s offshore investment opportunities and provide recommendations for international portfolio diversification.', 'Offshore Investment Strategy', 'email'),
  ('retirement-planning', 'Assess the client''s retirement readiness and provide recommendations for retirement income planning and lifestyle maintenance.', 'Retirement Planning Review', 'email'),
  ('investment-planning', 'Review the client''s investment portfolio and provide recommendations for portfolio optimization and growth strategies.', 'Investment Portfolio Review', 'email'),
  ('general-enquiry', 'Provide a professional and helpful response to the client''s general financial inquiry while maintaining a supportive and informative tone.', 'General Financial Advice', 'email')
ON CONFLICT DO NOTHING; 
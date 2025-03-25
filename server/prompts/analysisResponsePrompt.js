const analysisResponsePrompt = `
Context:
I'm a financial advisor {{advisor.first_name}} {{advisor.last_name}} from a wealth management company called {{advisor.company}}. A client has sent me an email which I have already analysed:

Analysis Data:
{{emailAnalysis.email_summary}}
Intent: {{emailAnalysis.email_intent}}
Key Topics: {{emailAnalysis.key_topics}}
Specific Questions: {{emailAnalysis.specific_questions}}
Raw Email: {{emailAnalysis.raw_email}}

Client Data:
Basic Information:
- Name: {{client.name}} {{client.surname}}
- Email: {{client.email}}
- Status: {{client.status}}
- Portfolio Value: {{client.portfolioValue}}
- Risk Profile: {{client.riskProfile}}
- Last Contact: {{client.lastContact}}

Documents:
{{#each clientDocuments}}
- {{this.title}} ({{this.type}}) - {{this.description}}
{{/each}}

Notes:
{{#each clientNotes}}
- {{this.content}} (Date: {{this.created_at}})
{{/each}}

Tasks:
{{#each clientTasks}}
- {{this.title}} - Status: {{this.status}}
{{/each}}

Instructions:
- Craft a response to their email and give financial advice.
- Do not recommend them to see other professionals for advice.
- Provide calculations to support your reasoning where necessary.
- Give specific recommendations and avoid scheduling a meeting to discuss.
- Ask questions if necessary.
- Don't be overtly friendly.
- Tell them whether something is a good idea or not.
- Do not make up information, only use the data provided.
`;

export default analysisResponsePrompt; 
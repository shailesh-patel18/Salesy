import { OpenAI } from 'openai';
import { searchTavily } from '@/lib/api-clients/tavily';

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { rows } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    // Return simulated results for Demo Mode
    const results = rows.slice(0, 10).map((row: any) => ({
      ...row,
      research_found: "Recent news suggests they are expanding their services and products (SIMULATED).",
      personalized_message: `Hi ${row.Name}, I saw that ${row.Company} is focused on innovation. Would love to connect!`,
      processing_status: 'success'
    }));
    return Response.json({ results });
  }

  // Cap at 10 rows for the MVP
  const limitedRows = rows.slice(0, 10);
  const results = [];

  for (const row of limitedRows) {
    const { Name, Title, Company } = row;
    const query = `${Company} recent news or ${Name} ${Title} accomplishment`;

    // Perform research
    const research = await searchTavily(query);

    // Generate personalized message
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional B2B closer. Write a short (<300 chars) LinkedIn request that mentions specific research. No generic fluff."
        },
        {
          role: "user",
          content: `Research content: ${research}\nPerson: ${Name}, ${Title} at ${Company}.`
        }
      ],
      max_tokens: 100,
    });

    results.push({
      ...row,
      research_found: research,
      personalized_message: completion.choices[0].message.content,
      processing_status: 'success'
    });
  }

  return Response.json({ results });
}

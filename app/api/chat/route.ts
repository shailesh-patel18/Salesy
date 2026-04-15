import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { findLeadsFromApollo } from '@/lib/api-clients/apollo';
import { findLeadsFromExplorium } from '@/lib/api-clients/explorium';
import { searchJobsSerp } from '@/lib/api-clients/serpapi';
import { searchTavily } from '@/lib/api-clients/tavily';
import { SYSTEM_PROMPT } from '@/lib/utils/prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, knowledgeBase } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    
    // DEMO MODE / NO KEY
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey.length < 10) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const text = "Hello! I am currently in **Demo Mode**. Since no OpenAI API key was found, I am simulating a high-quality sales response for you.\n\n" +
                       "Based on your request, I've used our internal 'Sales Discovery' tool to simulate these results. In a live environment, this would use GPT-4o-mini and real-time API data from Apollo.io and Explorium.ai.\n\n" +
                       "### Simulated Lead Generation\n" +
                       "I found 5 premium B2B UI/UX agencies for you. You can see the table below and even download the CSV!";
          
          const words = text.split(' ');
          for (const word of words) {
            controller.enqueue(encoder.encode(`0:"${word.replace(/"/g, '\\"')}${word.endsWith('\n') ? '' : ' '}"\n`));
            await new Promise(r => setTimeout(r, 20));
          }
          
          const toolResult = {
            toolCallId: "demo-1",
            toolName: "find_leads",
            args: {},
            result: {
              leads: [
                { company: "Demo Agency Alpha", name: "John Doe", title: "CEO", employees: 15 },
                { company: "Beta Design Studio", name: "Jane Smith", title: "Founder", employees: 8 }
              ],
              count: 2
            }
          };
          controller.enqueue(encoder.encode(`9:${JSON.stringify(toolResult)}\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-vercel-ai-data-stream': 'v1',
        },
      });
    }

    // LIVE MODE
    console.log("Chat API: Initiating live stream...");
    const result = await streamText({
      model: openai('gpt-4o-mini') as any, // Cast to any to resolve version-specific lint errors
      system: SYSTEM_PROMPT + (knowledgeBase ? `\nKnowledge Base Context:\n${knowledgeBase}` : ''),
      messages,
      tools: {
        find_leads: tool({
          description: 'Find B2B leads/companies with specific filters. Extract filters like industry, location, and seniority.',
          parameters: z.object({
            industry: z.string().optional(),
            location: z.string().optional(),
            seniority: z.string().optional(),
            employee_count: z.number().optional(),
          }),
          execute: async (filters) => {
            try {
              console.log("Tool: find_leads initiated with filters:", filters);
              const exploriumLeads = await findLeadsFromExplorium(filters);
              if (exploriumLeads.length > 0) return { leads: exploriumLeads, count: exploriumLeads.length, source: 'Explorium.ai' };
              
              const apolloLeads = await findLeadsFromApollo(filters);
              return { leads: apolloLeads, count: apolloLeads.length, source: 'Apollo.io' };
            } catch (err: any) {
              console.error("Critical Tool Error (find_leads):", err.message);
              return { error: "Lead sourcing failed. Please verify API keys.", leads: [] };
            }
          },
        }),
        search_jobs: tool({
          description: 'Search for job opportunities or projects.',
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            try {
              console.log("Tool: search_jobs initiated for query:", query);
              const jobs = await searchJobsSerp(query);
              return { jobs, count: jobs.length };
            } catch (err: any) {
              console.error("Critical Tool Error (search_jobs):", err.message);
              return { error: "Job search failed. Please verify SerpAPI key.", jobs: [] };
            }
          },
        }),
        research_company: tool({
          description: 'Perform web research on a specific company or individual.',
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            try {
              console.log("Tool: research_company initiated for query:", query);
              const research = await searchTavily(query);
              return { research };
            } catch (err: any) {
              console.error("Critical Tool Error (research_company):", err.message);
              return { error: "Research failed. Please verify Tavily key.", research: "" };
            }
          },
        }),
      },
      onFinish: (result) => {
        console.log("Chat API: Stream finished successfully.");
      },
      onError: (error) => {
        console.error("Chat API Stream Error:", error);
      }
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("FATAL: Critical Internal Error in /api/chat:", error.message);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

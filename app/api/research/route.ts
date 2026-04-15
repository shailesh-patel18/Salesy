import { searchTavily } from '@/lib/api-clients/tavily';

export async function POST(req: Request) {
  const { query } = await req.json();
  const research = await searchTavily(query);
  return Response.json({ research });
}

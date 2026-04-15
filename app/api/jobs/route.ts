import { searchJobsSerp } from '@/lib/api-clients/serpapi';

export async function POST(req: Request) {
  const { query } = await req.json();
  const jobs = await searchJobsSerp(query);
  return Response.json({ jobs });
}

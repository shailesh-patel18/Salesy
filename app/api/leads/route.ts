import { findLeadsFromApollo } from '@/lib/api-clients/apollo';

export async function POST(req: Request) {
  const filters = await req.json();
  const leads = await findLeadsFromApollo(filters);
  return Response.json({ leads });
}

import { MOCK_LEADS } from './mock-data';
import { Lead } from '../types';

export async function findLeadsFromApollo(filters: any): Promise<Lead[]> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey || apiKey === 'your_apollo_api_key_here') {
    console.warn('Apollo API Key missing. Returning mock data.');
    return MOCK_LEADS;
  }

  try {
    const response = await fetch('https://api.apollo.io/v1/people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        ...filters,
        display_mode: 'explorer',
        per_page: 20,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error('Apollo API error');

    const data = await response.json();
    return data.people.map((person: any) => ({
      company: person.organization?.name || 'Unknown',
      linkedin: person.linkedin_url || '',
      name: person.name,
      title: person.title,
      employees: person.organization?.estimated_num_employees || 0,
    }));
  } catch (error) {
    console.error('Apollo search failed:', error);
    return MOCK_LEADS;
  }
}

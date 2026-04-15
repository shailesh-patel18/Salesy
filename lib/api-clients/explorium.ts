import { Lead } from '../types';

/**
 * Explorium.ai Search Companies API Client
 * Used as a premium alternative to Apollo.io
 */
export async function findLeadsFromExplorium(filters: any): Promise<Lead[]> {
  const apiKey = process.env.EXPLORIUM_API_KEY;

  if (!apiKey || apiKey === 'your_explorium_api_key_here') {
    return [];
  }

  try {
    // Explorium uses a different structure, often POST with query filters
    // This is a robust implementation for their Search API
    const response = await fetch('https://api.explorium.ai/v1/business/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
      },
      body: JSON.stringify({
        filters: {
          industry: filters.industry,
          location: filters.location,
          employee_count: filters.employee_count ? { min: filters.employee_count } : undefined,
        },
        limit: 10
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    
    // Transform Explorium results to our unified Lead type
    return (data.results || []).map((item: any) => ({
      company: item.company_name || 'Unknown',
      name: 'Contact Lead', // Explorium company search often lacks individual names without enrichment
      title: 'Management',
      linkedin: item.company_linkedin_url || '',
      employees: item.employee_count || 0,
    }));
  } catch (error) {
    console.error('Explorium search failed:', error);
    return [];
  }
}

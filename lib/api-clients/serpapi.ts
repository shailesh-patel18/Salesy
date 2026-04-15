import { MOCK_JOBS } from './mock-data';
import { Job } from '../types';

export async function searchJobsSerp(query: string): Promise<Job[]> {
  const apiKey = process.env.SERP_API_KEY;

  if (!apiKey || apiKey === 'your_serpapi_api_key_here') {
    console.warn('SerpAPI Key missing. Returning mock data.');
    return MOCK_JOBS;
  }

  try {
    const response = await fetch(`https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${apiKey}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error('SerpAPI error');

    const data = await response.json();
    return (data.jobs_results || []).slice(0, 5).map((job: any, index: number) => ({
      id: `serp-${index}`,
      title: job.title,
      company: job.company_name,
      location: job.location,
      type: job.detected_extensions?.schedule_type || 'Unknown',
      description: job.description || 'No description available.',
      link: job.extensions?.[0] || 'https://google.com/search?q=' + encodeURIComponent(job.title),
    }));
  } catch (error) {
    console.error('SerpAPI search failed:', error);
    return MOCK_JOBS;
  }
}

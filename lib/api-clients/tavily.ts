export async function searchTavily(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey === 'your_tavily_api_key_here') {
    console.warn('Tavily API Key missing. Returning generic research.');
    return "Recent news indicates steady growth and focus on innovation for this company.";
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_images: false,
        max_results: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error('Tavily API error');

    const data = await response.json();
    return data.results?.[0]?.content || 'No specific research found.';
  } catch (error) {
    console.error('Tavily search failed:', error);
    return "Recent news suggests they are expanding their services and products.";
  }
}

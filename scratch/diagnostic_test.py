import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(".env.local")

def query_cloud_ai_test(prompt, provider, api_key):
    if provider == "Groq (Free/Fast)":
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama3-8b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }
    else:
        return {"error": "Only Groq test implemented"}
    
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print(f"Error Response: {res.text}")
            return {"error": res.text}
        
        content = res.json()['choices'][0]['message']['content']
        print(f"Raw Content: {content}")
        return json.loads(content)
    except Exception as e:
        print(f"Exception: {str(e)}")
        return {"error": str(e)}

# TEST RUN
test_prompt = """
Task: Analyze and filter this company based on the ICP description.
ICP DESCRIPTION: Creative agencies specializing in web design and development, employee strength under 50, headquarter in us only
COMPANY DATA: {'Company': 'The Kreativs', 'Website': 'https://thekreativs.com', 'Description': 'High-end UI/UX and Shopify development agency in Chicago.'}

Return ONLY a JSON object with:
{
    "match": "YES" or "NO",
    "reason": "one sentence reason",
    "company_name": "extracted name",
    "location": "city/state/country",
    "team_size": "est. employee count",
    "key_insights": "Detailed reasoning for ICP alignment"
}
"""

groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("MISSING GROQ_API_KEY")
else:
    result = query_cloud_ai_test(test_prompt, "Groq (Free/Fast)", groq_key)
    print("\nFINAL RESULT:")
    print(json.dumps(result, indent=2))

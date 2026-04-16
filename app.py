import streamlit as st
import pandas as pd
import requests
import json
from duckduckgo_search import DDGS
import time
import io
import os

# --- Page Config ---
st.set_page_config(page_title="SalesCo-Pilot Free", page_icon="🚀", layout="wide")

# (Keep existing styling)

# Custom UI Styling (Premium B2B Palette)
st.markdown("""
    <style>
    .main { background-color: #0f172a; color: #f8fafc; }
    .stButton>button { width: 100%; border-radius: 8px; background-color: #6366f1; color: white; border: none; height: 3.2em; font-weight: bold; }
    .stDownloadButton>button { width: 100%; border-radius: 8px; background-color: #10b981; color: white; border: none; height: 3.2em; }
    .sidebar .sidebar-content { background-color: #1e293b; }
    .status-box { padding: 20px; border-radius: 10px; background: #1e293b; border-left: 5px solid #6366f1; margin-bottom: 20px; }
    </style>
    """, unsafe_allow_html=True)

# --- Core Logic Functions ---

def query_ollama(prompt, model="llama3.2"):
    """Communication with local Ollama instance."""
    url = "http://localhost:11434/api/generate"
    try:
        response = requests.post(url, json={
            "model": model,
            "prompt": prompt + "\n\nIMPORTANT: Return ONLY a valid JSON object. No extra text.",
            "stream": False,
            "format": "json"
        }, timeout=45)
        if response.status_code == 200:
            return json.loads(response.json()['response'])
        return {"error": "Connection Failed"}
    except Exception as e:
        return {"error": str(e)}

def query_cloud_ai(prompt, provider, api_key):
    """Fallback for Cloud Deployment using Free APIs (Groq or Gemini)."""
    if provider == "Groq (Free/Fast)":
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama3-8b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }
    else: # Gemini
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {"contents": [{"parts": [{"text": prompt + " Return JSON format only."}]}]}
    
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        if provider == "Groq (Free/Fast)":
            return json.loads(res.json()['choices'][0]['message']['content'])
        else:
            txt = res.json()['candidates'][0]['content']['parts'][0]['text']
            # Clean gemini markdown if present
            clean_txt = txt.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_txt)
    except Exception as e:
        return {"error": str(e)}

def search_ddg(query, max_results=3):
    """Anonymous web search for company intelligence."""
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r['title']}\nSnippet: {r['body']}\nSource: {r['href']}")
        return "\n---\n".join(results)
    except:
        return ""

# --- UI Setup ---
st.sidebar.title("🚀 SalesCo-Pilot Free")
st.sidebar.caption("v1.1.0 | Cloud-Ready Upgrade")
st.sidebar.markdown("---")
module = st.sidebar.radio("Navigation", ["🎯 1. ICP Filter", "🔍 2. Executive Enricher"])
st.sidebar.markdown("---")
st.sidebar.subheader("Brain Settings")
mode = st.sidebar.selectbox("Model Type", ["Cloud (Free API)", "Local (Ollama)"])

if mode == "Local (Ollama)":
    ollama_model = st.sidebar.text_input("Ollama Model", value="llama3.2")
    cloud_provider = None
    cloud_key = None
else:
    cloud_provider = st.sidebar.selectbox("Provider", ["Groq (Free/Fast)", "Google Gemini"])
    
    # Check for keys in: 1. ENV, 2. Secrets
    env_key = os.getenv("GROQ_API_KEY", "") if cloud_provider == "Groq (Free/Fast)" else ""
    secret_key = ""
    if cloud_provider == "Groq (Free/Fast)" and "GROQ_API_KEY" in st.secrets:
        secret_key = st.secrets["GROQ_API_KEY"]
    
    final_default = secret_key if secret_key else env_key
    cloud_key = st.sidebar.text_input(f"Enter {cloud_provider} API Key", value=final_default, type="password")
    
    if final_default:
        st.sidebar.success(f"✅ Key loaded from {'Secrets' if secret_key else 'Environment'}")
    
st.sidebar.markdown("---")
st.sidebar.warning("Note: Enrichment accuracy is 50-70%.")

# Helper to run the selected brain
def run_ai(prompt):
    # Try to get key from sidebar first, then environment, then Streamlit Secrets
    final_key = cloud_key
    if not final_key:
        final_key = os.getenv("GROQ_API_KEY")
    if not final_key and "GROQ_API_KEY" in st.secrets:
        final_key = st.secrets["GROQ_API_KEY"]

    if mode == "Local (Ollama)":
        return query_ollama(prompt, model=ollama_model)
    else:
        if not final_key:
            st.error("Please enter your Cloud API Key in the sidebar or add it to Secrets!")
            st.stop()
        return query_cloud_ai(prompt, cloud_provider, final_key)

# --- Module 1: ICP Filter ---
if module == "🎯 1. ICP Filter":
    st.title("🎯 Smart ICP Filtering")
    st.markdown("""
        <div class='status-box'>
        <b>How it works:</b> Upload a list of companies. Describe your target (e.g. <i>'Tech startups with >50 employees'</i>). 
        Your local AI will analyze each company and decide who stays.
        </div>
    """, unsafe_allow_html=True)

    uploaded_file = st.file_uploader("Upload Company List (CSV or Excel)", type=["csv", "xlsx"])
    icp_desc = st.text_area("Describe your Ideal Customer Profile (ICP)", placeholder="Example: B2B SaaS companies in Europe with recent Series A funding...")

    if uploaded_file and icp_desc:
        try:
            df = pd.read_csv(uploaded_file) if uploaded_file.name.endswith('.csv') else pd.read_excel(uploaded_file)
            st.write(f"### Data Preview ({len(df)} rows)")
            st.dataframe(df.head(10), use_container_width=True)

            if st.button("🚀 Run AI Filtering"):
                progress_bar = st.progress(0)
                status_text = st.empty()
                results = []

                for index, row in df.iterrows():
                    status_text.text(f"Processing row {index+1}/{len(df)}: {row.get('Company', 'Row '+str(index))}")
                    
                    # Prompt Construction
                    prompt = f"""
                    Task: Filter this company based on the ICP description.
                    ICP DESCRIPTION: {icp_desc}
                    COMPANY ROW DATA: {row.to_dict()}
                    
                    Return JSON: {{"match": "YES" or "NO", "reason": "one sentence reason"}}
                    """
                    
                    response = run_ai(prompt)
                    results.append({
                        "Match": response.get("match", "NO"),
                        "Match Reason": response.get("reason", "N/A")
                    })
                    progress_bar.progress((index + 1) / len(df))

                # Combine
                final_df = pd.concat([df, pd.DataFrame(results)], axis=1)
                matches_df = final_df[final_df['Match'] == 'YES']
                
                st.success(f"Processing Complete! Found {len(matches_df)} matches out of {len(df)}.")
                st.dataframe(matches_df, use_container_width=True)

                # Download
                csv_buffer = io.BytesIO()
                matches_df.to_csv(csv_buffer, index=False)
                st.download_button("📥 Download Filtered Results", csv_buffer.getvalue(), "filtered_leads.csv", "text/csv")
        except Exception as e:
            st.error(f"Error reading file: {e}")

# --- Module 2: Executive Enricher ---
elif module == "🔍 2. Executive Enricher":
    st.title("🔍 Executive & Lead Enricher")
    st.markdown("""
        <div class='status-box'>
        <b>How it works:</b> We search public data to find the CEO, Founder, and Co-Founder of each company. 
        Ollama then parses the results to pick out names and LinkedIn URLs.
        </div>
    """, unsafe_allow_html=True)

    uploaded_file = st.file_uploader("Upload Filtered Company List", type=["csv", "xlsx"])

    if uploaded_file:
        try:
            df = pd.read_csv(uploaded_file) if uploaded_file.name.endswith('.csv') else pd.read_excel(uploaded_file)
            st.dataframe(df.head(5), use_container_width=True)

            if st.button("🔍 Start Enrichment Session"):
                progress_bar = st.progress(0)
                status_container = st.empty()
                enrich_data = []

                for index, row in df.iterrows():
                    company = row.get('Company', 'Unknown')
                    status_container.info(f"🔎 Enriching: {company}...")

                    # Search 1: General Discovery
                    search_results = search_ddg(f"{company} company founder CEO LinkedIn 2025")
                    search_results += "\n" + search_ddg(f"{company} executive team core members")

                    # AI Extraction
                    prompt = f"""
                    Extract leadership names and LinkedIn URLs from these search results for {company}.
                    Be conservative. If unsure, put "Not Found".
                    SEARCH RESULTS: {search_results}
                    
                    Return JSON: {{
                        "ceo_name": "", "ceo_linkedin": "",
                        "founder_name": "", "founder_linkedin": "",
                        "cofounder_name": "", "key_heads": ""
                    }}
                    """

                    ai_res = run_ai(prompt)
                    enrich_data.append({
                        "CEO": ai_res.get("ceo_name", "Not Found"),
                        "CEO_LinkedIn": ai_res.get("ceo_linkedin", "Not Found"),
                        "Founder": ai_res.get("founder_name", "Not Found"),
                        "Founder_LinkedIn": ai_res.get("founder_linkedin", "Not Found"),
                        "Co-Founder": ai_res.get("cofounder_name", "Not Found"),
                        "Key_Heads": ai_res.get("key_heads", "Not Found")
                    })
                    progress_bar.progress((index + 1) / len(df))

                # Combine
                enriched_df = pd.concat([df, pd.DataFrame(enrich_data)], axis=1)
                st.success("Enrichment Sequence Completed!")
                st.dataframe(enriched_df, use_container_width=True)

                # Download
                csv_buffer = io.BytesIO()
                enriched_df.to_csv(csv_buffer, index=False)
                st.download_button("📥 Download Enriched CSV", csv_buffer.getvalue(), "enriched_leads.csv", "text/csv")
        except Exception as e:
            st.error(f"Error: {e}")

import streamlit as st
import pandas as pd
import requests
import json
from duckduckgo_search import DDGS
import io
import os
import time
from dotenv import load_dotenv

# Load local environment variables (.env or .env.local)
load_dotenv()
load_dotenv(".env.local")

# --- Optimized Data Utilities ---

@st.cache_data
def convert_df_to_csv(dataframe):
    """Efficiently converts and encodes dataframe for downloads."""
    return dataframe.to_csv(index=False).encode('utf-8')

# --- Core AI Communication ---

def query_cloud_ai(prompt, provider, api_key, json_mode=True):
    """Stable Cloud AI Interface (Groq/Gemini)."""
    if provider == "Groq (Free/Fast)":
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.3-70b-versatile", 
            "messages": [{"role": "user", "content": prompt}],
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
    else: # Gemini
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {"contents": [{"parts": [{"text": prompt + (" Return JSON format only." if json_mode else "")}]}]}
    
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=90)
        if res.status_code != 200:
            return {"error": f"API Error ({res.status_code}): {res.text[:200]}"}
            
        if provider == "Groq (Free/Fast)":
            content = res.json()['choices'][0]['message']['content']
            if json_mode:
                return json.loads(content)
            return {"text": content}
        else:
            txt = res.json()['candidates'][0]['content']['parts'][0]['text']
            if json_mode:
                clean_txt = txt.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_txt)
            return {"text": txt}
    except Exception as e:
        return {"error": str(e)}

def search_ddg(query, max_results=3):
    """Web search for dynamic enrichment."""
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r['title']}\nSnippet: {r['body']}\nSource: {r['href']}")
        return "\n---\n".join(results)
    except:
        return ""

# --- UI Layout ---
st.set_page_config(page_title="SalesCo-Pilot Free", page_icon="🚀", layout="wide")

st.markdown("""
    <style>
    .main { background-color: #0f172a; color: #f8fafc; }
    .stButton>button { width: 100%; border-radius: 8px; background-color: #6366f1; color: white; border: none; height: 3.2em; font-weight: bold; }
    .log-container { background: #1e293b; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;}
    .batch-header { color: #3b82f6; font-weight: bold; margin-top: 10px; border-bottom: 1px solid #334155; padding-bottom: 5px; }
    </style>
    """, unsafe_allow_html=True)

st.sidebar.title("🚀 SalesCo-Pilot Free")
st.sidebar.caption("v1.5.0 | Enterprise Stability Mode")
st.sidebar.markdown("---")
module = st.sidebar.radio("Navigation", ["🎯 1. ICP Filter", "🔍 2. Executive Enricher"])
st.sidebar.markdown("---")

# Brain Settings
st.sidebar.subheader("Brain Settings")
mode = st.sidebar.selectbox("Model Type", ["Cloud (Free API)", "Local (Ollama)"])

if mode == "Cloud (Free API)":
    cloud_provider = st.sidebar.selectbox("Provider", ["Groq (Free/Fast)", "Google Gemini"])
    env_id = "GROQ_API_KEY" if cloud_provider == "Groq (Free/Fast)" else "GOOGLE_API_KEY"
    saved_key = os.getenv(env_id, "")
    cloud_key = st.sidebar.text_input(f"Enter {cloud_provider} API Key", value=saved_key, type="password")
else:
    cloud_key = None
    cloud_provider = None

def run_ai(prompt, json_mode=True):
    if mode == "Local (Ollama)":
        url = "http://localhost:11434/api/generate"
        try:
            res = requests.post(url, json={"model": "llama3.2", "prompt": prompt, "stream": False, "format": "json" if json_mode else ""}, timeout=90)
            if json_mode:
                return json.loads(res.json()['response'])
            return {"text": res.json()['response']}
        except Exception as e: return {"error": f"Local Ollama Not Found ({e})"}
    else:
        if not cloud_key: return {"error": "API Key Missing"}
        return query_cloud_ai(prompt, cloud_provider, cloud_key, json_mode)

# --- Module logic ---

if module == "🎯 1. ICP Filter":
    st.title("🎯 Smart ICP Filtering")
    
    uploaded_file = st.file_uploader("Upload Company List", type=["csv", "xlsx"])
    icp_desc = st.text_area("Describe your ICP")

    if uploaded_file and icp_desc:
        df = pd.read_csv(uploaded_file) if uploaded_file.name.endswith('.csv') else pd.read_excel(uploaded_file)
        
        # --- Advanced Filtering UI ---
        st.sidebar.header("Filter Results")
        search_cols = [c for c in df.columns if any(x in c.lower() for x in ['name', 'company', 'gtm'])]
        search_query = st.sidebar.text_input("🔍 Search Company / GTM Name")
        
        filtered_df = df.copy()
        if search_query and search_cols:
            mask = filtered_df[search_cols[0]].str.contains(search_query, case=False, na=False)
            filtered_df = filtered_df[mask]

        st.subheader(f"Data Preview ({len(filtered_df)} items)")
        st.dataframe(filtered_df.head(10), width="stretch")

        if st.button("🚀 Run AI Analysis"):
            # UI Containers for real-time appending
            report_placeholder = st.container()
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # --- CUMULATIVE STATE ---
            all_enriched_data = [] # Master list for table
            total_matches = 0
            
            # --- BATCHING STATE ---
            batch_size = 10  # Reduced to 10 for maximum safety
            total_rows = len(filtered_df)
            minimal_df = filtered_df.reset_index(drop=True)
            
            with report_placeholder:
                st.markdown("### 🔍 SalesCo-Pilot Live Analysis Report")
                
            for start_idx in range(0, total_rows, batch_size):
                end_idx = min(start_idx + batch_size, total_rows)
                chunk_df = minimal_df.iloc[start_idx:end_idx].copy()
                chunk_df['row_index'] = chunk_df.index
                
                status_text.info(f"Analyzing Rows {start_idx} to {end_idx-1}...")
                
                # --- PROMPT ---
                data_json_str = chunk_df.to_json(orient="records")
                full_prompt = f"""You are SalesCo-Pilot AI Agent — a transparent Sales Intelligence specialist.
Process this BATCH of rows ({start_idx} to {end_idx-1}).

ICP description: "{icp_desc}"

Raw Data:
{data_json_str}

Then output in two parts:

=== PART 1: PROGRESS LOG (Markdown for the user) ===
**Batch Analysis: Rows {start_idx}-{end_idx-1}**
(Step-by-step notes on schema, URLs found, and ICP checks for THESE rows only)

=== PART 2: STRUCTURED JSON (for the app) ===
{{
  "total_processed": {len(chunk_df)},
  "matches_count": 0,
  "summary": "...",
  "enriched_data": [
    {{
      "row_index": X,
      "company_name": "...",
      "match": "YES" or "NO",
      "reason": "...",
      "enriched_website": "...",
      "key_insights": "..."
    }}
  ]
}}"""
                
                # --- API CALL WITH RETRIES ---
                success = False
                retries = 2
                while not success and retries >= 0:
                    res = run_ai(full_prompt, json_mode=False)
                    if "error" in res:
                        if "429" in res["error"]:
                            status_text.warning(f"Rate limited. Waiting 10s... (Retries left: {retries})")
                            time.sleep(10)
                            retries -= 1
                        else:
                            st.error(f"Analysis failed at batch {start_idx}: {res['error']}")
                            st.stop()
                    else:
                        output_text = res["text"]
                        
                        import re
                        
                        # --- STAGE 1: SEPARATOR SPLIT ---
                        separator = "=== PART 2: STRUCTURED JSON"
                        part1, part2 = None, None
                        
                        if separator in output_text:
                            parts = output_text.split(separator)
                            part1 = parts[0]
                            part2 = parts[1]
                        else:
                            # --- STAGE 2: REGEX FALLBACK (Hunt for JSON) ---
                            part1 = output_text
                            # Find the last occurrence of something that looks like a JSON block starting with {
                            json_match = re.findall(r"(\{.*\}|\[.*\])", output_text, re.DOTALL)
                            if json_match:
                                part2 = json_match[-1] # Take the most complete look-alike
                        
                        if part2:
                            # Update UI Report
                            with report_placeholder:
                                clean_md = part1.replace('=== PART 1: PROGRESS LOG (Markdown for the user) ===', '').strip()
                                st.markdown(f"<div class='log-container'>{clean_md}</div>", unsafe_allow_html=True)
                            
                            # Clean JSON string
                            json_str = part2.strip()
                            if "```json" in json_str: json_str = json_str.split("```json")[-1].split("```")[0].strip()
                            elif "```" in json_str: json_str = json_str.split("```")[-1].split("```")[0].strip()
                            
                            try:
                                parsed_json = json.loads(json_str)
                                chunk_results = parsed_json.get("enriched_data", [])
                                all_enriched_data.extend(chunk_results)
                                total_matches += parsed_json.get("matches_count", 0)
                                success = True
                            except:
                                if retries == 0:
                                    st.warning(f"⚠️ Batch {start_idx}-{end_idx-1} parsing failed. Skipping rows to protect session.")
                                    success = True # Soft-failure: act like it worked but don't add data
                                retries -= 1
                        else:
                            if retries == 0:
                                st.warning(f"⚠️ Metadata error in batch {start_idx}. Attempting recovery.")
                                success = True
                            retries -= 1
                
                progress_bar.progress(end_idx / total_rows)
            
            # --- FINAL MERGE & DISPLAY ---
            status_text.success("All batches processed successfully!")
            
            enrich_dict = {item.get("row_index"): item for item in all_enriched_data if item.get("row_index") is not None}
            final_rows = []
            for idx, row in minimal_df.iterrows():
                merged = row.to_dict()
                ai_data = enrich_dict.get(idx, {})
                ai_cols = {
                    "Match": str(ai_data.get("match", "NO")).upper(),
                    "Reason": ai_data.get("reason", "No data."),
                    "Enriched Website": ai_data.get("enriched_website", "N/A"),
                    "Key Insights": ai_data.get("key_insights", "N/A")
                }
                final_rows.append({**ai_cols, **merged})
                
            final_df = pd.DataFrame(final_rows)
            st.metric("Total Matches Discovered", total_matches)

            def highlight_matched_rows(row):
                return ['background-color: #064e3b' if row.Match == 'YES' else '' for _ in row]
            
            st.subheader("🎯 Final Lead Sheet")
            st.dataframe(final_df.style.apply(highlight_matched_rows, axis=1), width="stretch")
            st.download_button("📥 Download Analysis", convert_df_to_csv(final_df), "lead_analysis.csv", "text/csv", width="stretch")

elif module == "🔍 2. Executive Enricher":
    st.title("🔍 AI Enrichment & Crawling")
    st.info("Upload a list to deep-crawl CEO and decision maker data.")
    uploaded_file = st.file_uploader("Upload Lead List", type=["csv", "xlsx"])

    if uploaded_file:
        df = pd.read_csv(uploaded_file) if uploaded_file.name.endswith('.csv') else pd.read_excel(uploaded_file)
        name_col = next((c for c in df.columns if 'name' in c.lower() or 'gtm-name' in c.lower()), df.columns[0])
        web_col = next((c for c in df.columns if 'url' in c.lower() or 'website' in c.lower() or 'href' in c.lower()), None)
        
        st.dataframe(df.head(5), width="stretch")
        
        if st.button("🕸️ Run Deep AI Enrichment"):
            progress = st.progress(0)
            enriched_results = []
            for idx, row in df.iterrows():
                search_context = search_ddg(f"{row[name_col]} company overview services location")
                prompt = f"Analyze: '{row[name_col]}'\nContext: {search_context[:2000]}\nReturn ONLY JSON: {{\"detailed_description\": \"...\", \"industry\": \"...\", \"likely_decision_maker\": \"...\"}}"
                enrichment = run_ai(prompt, json_mode=True)
                enriched_results.append({
                    "Detailed Description": enrichment.get("detailed_description", "N/A"),
                    "Industry": enrichment.get("industry", "N/A"),
                    "Target Persona": enrichment.get("likely_decision_maker", "N/A")
                })
                progress.progress((idx + 1) / len(df))
            
            final_df = pd.concat([df, pd.DataFrame(enriched_results)], axis=1)
            st.dataframe(final_df, width="stretch")
            st.download_button("📥 Download", convert_df_to_csv(final_df), "enriched.csv", "text/csv", key="exec-dl", width="stretch")

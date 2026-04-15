# 🚀 SalesCo-Pilot Free (100% Local & Free)

A production-grade prospecting dashboard built for speed, privacy, and cost-efficiency. No OpenAI keys, no monthly subscriptions.

## 🛠️ Installation & Setup

### 1. Install Ollama
Download and install [Ollama](https://ollama.com/). This is the core engine for our AI tasks.
After installing, open your terminal and pull our recommended model:
```bash
ollama run llama3.2
```

### 2. Configure Python
Make sure you have Python 3.9 or higher. Install the project dependencies:
```bash
pip install -r requirements.txt
```

### 3. Launch the Dashboard
Run this command to start the application:
```bash
streamlit run app.py
```

## 🎯 Key Features
- **Smart ICP Filter**: Uses local LLMs to intelligently filter match companies based on your description.
- **Executive Enrichment**: Automatically finds CEO/Founder names and LinkedIn references using anonymous web searches.
- **Privacy First**: All data stays on your machine. Nothing is sent to the cloud.

## 🛡️ Important Notes
- Enrichment accuracy varies by company size and public footprint (typically 50-70%).
- This tool adheres strictly to privacy standards and **does not crawl LinkedIn**. It only parses public search engine data.

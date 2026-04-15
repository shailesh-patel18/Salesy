# Requirements Document

## Introduction

SalesCo-Pilot Free is a standalone Python/Streamlit desktop web application that provides two core sales productivity modules — ICP Filtering and Executive Enrichment — using only free, local, and open-source tools. It uses Ollama (local LLM) for AI reasoning and DuckDuckGo search for public web enrichment. No paid APIs or API keys are required.

## Glossary

- **ICP**: Ideal Customer Profile — a description of the type of company that is a perfect fit for a product or service.
- **Ollama**: A free, locally-running LLM server that exposes a REST API on localhost.
- **LLM**: Large Language Model — used here for intelligent text classification and extraction.
- **Enrichment**: The process of finding and appending executive contact information to company records.
- **DuckDuckGo Search**: A free, no-auth-required web search API used via the `duckduckgo-search` Python library.
- **Match Reason**: A one-sentence explanation of why a company matches or does not match the ICP.
- **Key_Heads**: A combined field listing names and roles of notable executives beyond CEO/Founder (e.g., CTO, Head of Sales).
- **App**: The SalesCo-Pilot Free Streamlit application.
- **User**: A salesperson or growth professional using the App.
- **Batch**: A group of rows processed together to manage rate limits and show progress.

---

## Requirements

### Requirement 1: Application Shell and Navigation

**User Story:** As a user, I want a clean, dark-themed Streamlit app with two clearly labeled modules, so that I can navigate between ICP filtering and executive enrichment without confusion.

#### Acceptance Criteria

1. THE App SHALL render a sidebar with two navigation options: "1. Filter by ICP" and "2. Enrich Executives".
2. THE App SHALL apply a dark theme with professional styling using custom CSS injected via `st.markdown`.
3. THE App SHALL display the application title "SalesCo-Pilot Free" and a subtitle in the main area.
4. WHEN the App starts, THE App SHALL default to the "Filter by ICP" tab.
5. THE App SHALL display a disclaimer: "This is a free tool. Enrichment accuracy is 50–70%. LinkedIn crawling is not used."

---

### Requirement 2: File Upload and Preview

**User Story:** As a user, I want to upload a CSV or Excel file and see a preview of its contents, so that I can confirm the correct file was loaded before processing.

#### Acceptance Criteria

1. WHEN a user uploads a file, THE App SHALL accept both `.csv` and `.xlsx` file formats.
2. WHEN a valid file is uploaded, THE App SHALL display the first 5 rows as a preview table.
3. WHEN a valid file is uploaded, THE App SHALL display the total row count and column names.
4. IF an unsupported file format is uploaded, THEN THE App SHALL display a clear error message and halt processing.
5. IF the uploaded file is empty or has no data rows, THEN THE App SHALL display a warning and halt processing.

---

### Requirement 3: Ollama Connectivity Check

**User Story:** As a user, I want the app to check if Ollama is running before I start processing, so that I get a clear error instead of a silent failure.

#### Acceptance Criteria

1. WHEN the App loads, THE App SHALL attempt to connect to the Ollama API at `http://localhost:11434`.
2. IF Ollama is not reachable, THEN THE App SHALL display a prominent error banner with setup instructions.
3. WHEN Ollama is reachable, THE App SHALL display the available models and allow the user to select one.
4. THE App SHALL default to `llama3.2` if available, otherwise use the first available model.
5. IF no models are available in Ollama, THEN THE App SHALL display instructions to pull a model via `ollama pull llama3.2`.

---

### Requirement 4: ICP Filter Module — Core Logic

**User Story:** As a salesperson, I want to describe my Ideal Customer Profile in plain English and have the app filter my company list automatically, so that I can focus only on the best-fit prospects.

#### Acceptance Criteria

1. THE ICP_Filter_Module SHALL provide a text area for the user to enter a plain-English ICP description.
2. WHEN the user clicks "Run ICP Filter", THE ICP_Filter_Module SHALL send each company row's data along with the ICP description to Ollama.
3. THE ICP_Filter_Module SHALL instruct Ollama to respond with exactly "YES" or "NO" followed by a one-sentence reason.
4. THE ICP_Filter_Module SHALL parse Ollama's response and populate an `ICP_Match` column ("YES"/"NO") and a `Match_Reason` column.
5. WHEN processing is complete, THE ICP_Filter_Module SHALL display only the matching rows in a results table.
6. THE ICP_Filter_Module SHALL process rows in batches of 10 and update a progress bar after each batch.
7. IF Ollama returns an unparseable response, THEN THE ICP_Filter_Module SHALL mark that row as "UNKNOWN" with reason "LLM response could not be parsed".

---

### Requirement 5: ICP Filter Module — Download

**User Story:** As a user, I want to download the filtered results as a CSV or Excel file, so that I can use them in my CRM or outreach tools.

#### Acceptance Criteria

1. WHEN ICP filtering is complete, THE ICP_Filter_Module SHALL display a download button for the filtered results as CSV.
2. WHEN ICP filtering is complete, THE ICP_Filter_Module SHALL display a download button for the filtered results as Excel (.xlsx).
3. THE ICP_Filter_Module SHALL include all original columns plus `ICP_Match` and `Match_Reason` in the download.
4. THE downloaded file SHALL be named `icp_filtered_results.csv` or `icp_filtered_results.xlsx` respectively.

---

### Requirement 6: Executive Enricher Module — Search and Extraction

**User Story:** As a salesperson, I want the app to find CEO, Founder, Co-Founder, and other key executive names for each company, so that I can personalize my outreach.

#### Acceptance Criteria

1. THE Executive_Enricher SHALL accept a CSV or Excel file upload (typically the output of the ICP Filter Module).
2. THE Executive_Enricher SHALL require a column named `Company` or `company_name` (case-insensitive match) to identify company names.
3. FOR each company, THE Executive_Enricher SHALL construct and execute DuckDuckGo search queries including: "CEO of [Company] 2025", "Founder [Company] LinkedIn", "[Company] leadership team".
4. THE Executive_Enricher SHALL pass the raw search result snippets to Ollama and instruct it to extract: CEO name, CEO LinkedIn URL, Founder name, Founder LinkedIn URL, Co-Founder name, and Key Heads (role + name pairs).
5. IF Ollama cannot confidently extract a field, THEN THE Executive_Enricher SHALL populate that field with "Not Found".
6. THE Executive_Enricher SHALL add columns: `CEO_Name`, `CEO_LinkedIn`, `Founder_Name`, `Founder_LinkedIn`, `CoFounder_Name`, `Key_Heads` to the output.
7. THE Executive_Enricher SHALL NOT scrape or crawl LinkedIn directly.

---

### Requirement 7: Executive Enricher Module — Progress and Download

**User Story:** As a user, I want to see progress while enrichment runs and download the enriched file when done, so that I know the app is working and can use the results.

#### Acceptance Criteria

1. THE Executive_Enricher SHALL display a progress bar that updates after each company is processed.
2. THE Executive_Enricher SHALL display a status message showing the current company being processed (e.g., "Processing 12/50: Acme Corp").
3. WHEN enrichment is complete, THE Executive_Enricher SHALL display a summary: total processed, total enriched (at least one field found), total not found.
4. WHEN enrichment is complete, THE Executive_Enricher SHALL provide download buttons for CSV and Excel formats.
5. THE downloaded enriched file SHALL be named `enriched_executives.csv` or `enriched_executives.xlsx`.
6. THE Executive_Enricher SHALL process companies one at a time with a 1-second delay between requests to avoid rate limiting.

---

### Requirement 8: Error Handling and Resilience

**User Story:** As a user, I want the app to handle errors gracefully without crashing, so that partial results are not lost if something goes wrong mid-run.

#### Acceptance Criteria

1. IF a DuckDuckGo search fails for a company, THEN THE Executive_Enricher SHALL log the error, mark all enrichment fields as "Search Failed", and continue to the next company.
2. IF Ollama times out or returns an error for a row, THEN THE App SHALL mark that row's LLM-dependent fields as "LLM Error" and continue processing.
3. THE App SHALL display a non-blocking warning toast/message for each row-level error without stopping the overall run.
4. IF the user attempts to run processing without uploading a file, THEN THE App SHALL display a clear prompt to upload a file first.
5. IF the user attempts to run processing without entering an ICP description (for ICP Filter), THEN THE App SHALL display a validation error.

---

### Requirement 9: Configuration and Usability

**User Story:** As a user, I want to configure the Ollama model and batch size from the UI, so that I can tune performance based on my hardware.

#### Acceptance Criteria

1. THE App SHALL provide a sidebar selector for the Ollama model (populated from available local models).
2. THE App SHALL provide a sidebar numeric input for batch size (default: 10, range: 1–50) for ICP filtering.
3. THE App SHALL display estimated processing time based on row count and average LLM response time.
4. WHERE the user has not yet run any processing, THE App SHALL show a "Ready" status indicator in the sidebar.
5. WHILE processing is running, THE App SHALL disable the run button to prevent duplicate submissions.

# Implementation Plan: SalesCo-Pilot Free

## Overview

Build a standalone Python/Streamlit app with two modules: ICP Filter (local LLM classification) and Executive Enricher (DuckDuckGo + LLM extraction). All logic is split into focused utility modules imported by the main `app.py`.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create `requirements.txt` with: streamlit, pandas, openpyxl, requests, duckduckgo-search, pytest, hypothesis
  - Create the folder structure: `app.py`, `ollama_client.py`, `icp_filter.py`, `enricher.py`, `search_client.py`, `file_utils.py`, `tests/`
  - _Requirements: 1.1, 9.1_

- [x] 2. Implement file utilities
  - [x] 2.1 Implement `file_utils.py`
    - Write `load_file(uploaded_file) -> pd.DataFrame` supporting CSV and XLSX
    - Write `to_csv_bytes(df)` and `to_excel_bytes(df)` for download serialization
    - Write `find_company_column(df) -> str | None` with case-insensitive matching
    - _Requirements: 2.1, 2.4, 2.5, 6.2_
  - [x] 2.2 Write property test for file loading (Property 1)
    - **Property 1: File loading preserves data**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  - [-] 2.3 Write property test for company column detection (Property 11)
    - **Property 11: Company column detection is case-insensitive**
    - **Validates: Requirements 6.2**

- [ ] 3. Implement Ollama client
  - [ ] 3.1 Implement `ollama_client.py`
    - Write `check_ollama() -> tuple[bool, list[str]]` that hits `http://localhost:11434/api/tags`
    - Write `query_ollama(model, prompt, timeout=30) -> str` that posts to `/api/generate`
    - Handle `requests.exceptions.ConnectionError` and timeout gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.2_
  - [ ] 3.2 Write unit tests for Ollama client
    - Test `check_ollama()` with mocked responses: running with models, running with no models, connection refused
    - Test `query_ollama()` timeout raises handled exception

- [ ] 4. Implement ICP Filter logic
  - [ ] 4.1 Implement `icp_filter.py`
    - Write `build_icp_prompt(row: dict, icp_description: str) -> str`
    - Write `parse_icp_response(response: str) -> tuple[str, str]` — handles YES/NO/UNKNOWN
    - Write `run_icp_filter(df, icp_description, model, batch_size, progress_callback) -> pd.DataFrame`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ] 4.2 Write property test for ICP prompt construction (Property 2)
    - **Property 2: ICP prompt contains row data and ICP description**
    - **Validates: Requirements 4.2, 4.3**
  - [ ] 4.3 Write property test for ICP response parser (Property 3)
    - **Property 3: ICP response parser handles all inputs correctly**
    - **Validates: Requirements 4.4, 4.7**
  - [ ] 4.4 Write property test for ICP filter output schema (Property 4)
    - **Property 4: ICP filter output preserves all original columns**
    - **Validates: Requirements 4.4, 5.3**
  - [ ] 4.5 Write property test for ICP filter results (Property 5)
    - **Property 5: ICP filter results contain only matching rows**
    - **Validates: Requirements 4.5**

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement search client
  - [ ] 6.1 Implement `search_client.py`
    - Write `build_search_queries(company_name: str) -> list[str]` returning at least 3 queries
    - Write `search_company(queries: list[str], max_results: int = 5) -> str` using `duckduckgo-search`
    - Handle search exceptions and return empty string on failure
    - _Requirements: 6.3, 8.1_
  - [ ] 6.2 Write property test for search query construction (Property 6)
    - **Property 6: Search query construction contains company name and keywords**
    - **Validates: Requirements 6.3**

- [ ] 7. Implement Executive Enricher logic
  - [ ] 7.1 Implement `enricher.py`
    - Write `build_enrichment_prompt(company_name, search_snippets) -> str`
    - Write `parse_enrichment_response(response: str) -> dict` extracting all 6 enrichment fields
    - Write `run_enrichment(df, model, progress_callback) -> pd.DataFrame` with 1s delay between companies
    - Handle search failures (mark "Search Failed") and LLM failures (mark "LLM Error")
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 7.6, 8.1, 8.2_
  - [ ] 7.2 Write property test for enrichment output schema (Property 7)
    - **Property 7: Enrichment output schema is always complete**
    - **Validates: Requirements 6.6**
  - [ ] 7.3 Write property test for missing enrichment fields (Property 8)
    - **Property 8: Missing enrichment fields default to "Not Found"**
    - **Validates: Requirements 6.5**
  - [ ] 7.4 Write property test for search failure resilience (Property 9)
    - **Property 9: Search failure resilience**
    - **Validates: Requirements 8.1**
  - [ ] 7.5 Write property test for LLM failure resilience (Property 10)
    - **Property 10: LLM failure resilience**
    - **Validates: Requirements 8.2**

- [ ] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Build the Streamlit UI (`app.py`)
  - [ ] 9.1 Implement app shell, dark theme CSS, sidebar navigation, and Ollama status check
    - Render sidebar with "1. Filter by ICP" and "2. Enrich Executives" options
    - Inject dark theme CSS via `st.markdown`
    - Call `check_ollama()` on load; show error banner if not running
    - Show model selector and batch size input in sidebar
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.4, 9.5_
  - [ ] 9.2 Implement ICP Filter Module UI
    - File upload widget (CSV/XLSX), preview table, row/column count display
    - ICP description text area with validation
    - "Run ICP Filter" button (disabled while running)
    - Progress bar + batch status messages
    - Results table showing only matched rows
    - CSV and Excel download buttons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.6, 5.1, 5.2, 5.4, 8.4, 8.5, 9.3_
  - [ ] 9.3 Implement Executive Enricher Module UI
    - File upload widget, preview table
    - "Run Enrichment" button (disabled while running)
    - Per-company progress bar and status message
    - Enrichment summary (total processed / enriched / not found)
    - CSV and Excel download buttons
    - _Requirements: 6.1, 7.1, 7.2, 7.3, 7.4, 7.5, 8.4_

- [ ] 10. Create README.md
  - Write setup instructions: install Python, install Ollama, `ollama pull llama3.2`, `pip install -r requirements.txt`, `streamlit run app.py`
  - Document both modules with screenshots placeholder
  - Add disclaimer about enrichment accuracy and LinkedIn policy
  - _Requirements: 1.5_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests and unit tests are required
- Each task references specific requirements for traceability
- Property tests use `pytest-hypothesis` with `max_examples=100`
- All Ollama calls use the `/api/generate` endpoint with `stream: false`
- DuckDuckGo search uses the `duckduckgo-search` library (`DDGS().text()`)

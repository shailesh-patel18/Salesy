# File I/O Utilities
# Requirements: 2.1, 2.4, 2.5, 6.2

import io
import pandas as pd


def load_file(uploaded_file) -> pd.DataFrame:
    """Loads a CSV or XLSX uploaded file into a DataFrame.
    
    Supports both .csv and .xlsx formats.
    Raises ValueError for unsupported formats or empty files.
    """
    name = getattr(uploaded_file, "name", "")
    if name.endswith(".csv"):
        df = pd.read_csv(uploaded_file)
    elif name.endswith(".xlsx"):
        df = pd.read_excel(uploaded_file, engine="openpyxl")
    else:
        raise ValueError(f"Unsupported file format: '{name}'. Please upload a .csv or .xlsx file.")

    if df.empty:
        raise ValueError("The uploaded file contains no data rows.")

    return df


def to_csv_bytes(df: pd.DataFrame) -> bytes:
    """Serializes a DataFrame to CSV bytes for download."""
    return df.to_csv(index=False).encode("utf-8")


def to_excel_bytes(df: pd.DataFrame) -> bytes:
    """Serializes a DataFrame to Excel (.xlsx) bytes for download."""
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    return buffer.getvalue()


def find_company_column(df: pd.DataFrame) -> str | None:
    """Case-insensitive search for a 'company' or 'company_name' column.
    
    Returns the actual column name as it appears in the DataFrame, or None.
    """
    targets = {"company", "company_name"}
    for col in df.columns:
        if col.strip().lower() in targets:
            return col
    return None

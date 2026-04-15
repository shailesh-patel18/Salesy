# Tests for file_utils.py
# Feature: salesco-pilot-free

import io
import pandas as pd
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.pandas import column, data_frames, range_indexes

from file_utils import load_file, to_csv_bytes, to_excel_bytes, find_company_column


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class FakeUploadedFile:
    """Mimics a Streamlit UploadedFile with a .name attribute."""

    def __init__(self, name: str, data: bytes):
        self.name = name
        self._buf = io.BytesIO(data)

    def read(self, *args, **kwargs):
        return self._buf.read(*args, **kwargs)

    def seek(self, *args, **kwargs):
        return self._buf.seek(*args, **kwargs)

    def tell(self, *args, **kwargs):
        return self._buf.tell(*args, **kwargs)

    # pandas / openpyxl call these on file-like objects
    def readable(self):
        return True

    def seekable(self):
        return True


def df_to_fake_csv(df: pd.DataFrame) -> FakeUploadedFile:
    data = df.to_csv(index=False).encode("utf-8")
    return FakeUploadedFile("data.csv", data)


def df_to_fake_xlsx(df: pd.DataFrame) -> FakeUploadedFile:
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    return FakeUploadedFile("data.xlsx", buf.getvalue())


# ---------------------------------------------------------------------------
# Property 1: File loading preserves data
# Feature: salesco-pilot-free, Property 1: File loading preserves data
# Validates: Requirements 2.1, 2.2, 2.3
# ---------------------------------------------------------------------------

_text_col = st.text(
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd"), min_codepoint=32),
    min_size=1,
    max_size=20,
)

_df_strategy = data_frames(
    columns=[
        column("col_a", elements=_text_col),
        column("col_b", elements=st.integers(min_value=0, max_value=1000)),
    ],
    index=range_indexes(min_size=1, max_size=20),
)


@settings(max_examples=100)
@given(df=_df_strategy)
def test_property1_csv_load_preserves_shape(df):
    # Feature: salesco-pilot-free, Property 1: File loading preserves data (CSV)
    fake = df_to_fake_csv(df)
    result = load_file(fake)
    assert result.shape == df.shape
    assert list(result.columns) == list(df.columns)


@settings(max_examples=100, deadline=None)
@given(df=_df_strategy)
def test_property1_xlsx_load_preserves_shape(df):
    # Feature: salesco-pilot-free, Property 1: File loading preserves data (XLSX)
    fake = df_to_fake_xlsx(df)
    result = load_file(fake)
    assert result.shape == df.shape
    assert list(result.columns) == list(df.columns)


# ---------------------------------------------------------------------------
# Property 11: Company column detection is case-insensitive
# Feature: salesco-pilot-free, Property 11: Company column detection is case-insensitive
# Validates: Requirements 6.2
# ---------------------------------------------------------------------------

_company_variants = st.sampled_from([
    "company", "Company", "COMPANY", "cOmPaNy",
    "company_name", "Company_Name", "COMPANY_NAME", "Company_name",
])


@settings(max_examples=100)
@given(col_name=_company_variants)
def test_property11_find_company_column_case_insensitive(col_name):
    # Feature: salesco-pilot-free, Property 11: Company column detection is case-insensitive
    df = pd.DataFrame({col_name: ["Acme", "Globex"], "revenue": [100, 200]})
    result = find_company_column(df)
    assert result == col_name


def test_find_company_column_returns_none_when_absent():
    df = pd.DataFrame({"name": ["Acme"], "revenue": [100]})
    assert find_company_column(df) is None


# ---------------------------------------------------------------------------
# Unit tests — unsupported format and empty file
# ---------------------------------------------------------------------------

def test_load_file_unsupported_format_raises():
    fake = FakeUploadedFile("data.json", b'{"a": 1}')
    with pytest.raises(ValueError, match="Unsupported file format"):
        load_file(fake)


def test_load_file_empty_csv_raises():
    fake = FakeUploadedFile("data.csv", b"col_a,col_b\n")
    with pytest.raises(ValueError, match="no data rows"):
        load_file(fake)


# ---------------------------------------------------------------------------
# Round-trip serialization sanity checks
# ---------------------------------------------------------------------------

def test_to_csv_bytes_round_trip():
    df = pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})
    result = pd.read_csv(io.BytesIO(to_csv_bytes(df)))
    assert list(result.columns) == list(df.columns)
    assert len(result) == len(df)


def test_to_excel_bytes_round_trip():
    df = pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})
    result = pd.read_excel(io.BytesIO(to_excel_bytes(df)), engine="openpyxl")
    assert list(result.columns) == list(df.columns)
    assert len(result) == len(df)

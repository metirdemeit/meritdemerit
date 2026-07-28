import os
from datetime import datetime, timezone
from typing import Iterable, List, Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


def _now_utc_tag() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%SZ")


def get_sheets_service():
    """
    Build Google Sheets API service using Service Account.

    Requires env:
    - GOOGLE_SERVICE_ACCOUNT_FILE: path to service account json
    """
    creds_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
    if not creds_file:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_FILE is required")

    creds = service_account.Credentials.from_service_account_file(creds_file, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def ensure_sheet(service, spreadsheet_id: str, title: Optional[str] = None) -> str:
    """
    Ensure a sheet exists. If title is None, creates a timestamped title.
    Returns the sheet title used.
    """
    sheets_api = service.spreadsheets()
    meta = sheets_api.get(spreadsheetId=spreadsheet_id).execute()
    existing_titles = {
        s["properties"]["title"] for s in meta.get("sheets", []) if "properties" in s and "title" in s["properties"]
    }

    if title and title in existing_titles:
        return title

    if not title:
        title = f"PointHistory_{_now_utc_tag()}"

    body = {"requests": [{"addSheet": {"properties": {"title": title}}}]}
    sheets_api.batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
    return title


def write_values(
    service,
    spreadsheet_id: str,
    sheet_title: str,
    values: List[List[str]],
):
    """
    Overwrite values starting from A1 in the given sheet.
    """
    range_name = f"{sheet_title}!A1"
    body = {"values": values}
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=range_name,
        valueInputOption="RAW",
        body=body,
    ).execute()


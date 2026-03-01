# Python Utilities

Data processing and utility scripts for Zuldeira Amplifi.

## Setup

Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### AssetProcessor

Bulk asset processing, tagging, and management:

```python
from python.processor import AssetProcessor

processor = AssetProcessor()

# List assets in GCS bucket
assets = processor.list_assets()

# Upload a local file to GCS
url = processor.upload_asset("local_image.jpg", "images/sample.jpg")

# Download an asset from GCS
processor.download_asset("images/sample.jpg", "./downloaded.jpg")

# Batch tag multiple images
tagged = processor.batch_tag_assets(["img1.jpg", "img2.jpg"])
```

## Example Scripts

- **`example_bulk_process.py`** — Demonstrates listing and processing assets in bulk

Run example:
```bash
cd python
python example_bulk_process.py
```

## Environment Variables

Requires:
- `GEMINI_API_KEY` — Your Gemini API key
- `GCS_BUCKET_NAME` — GCS bucket name (defaults to `zuldeira-amplifi-output`)
- `GOOGLE_APPLICATION_CREDENTIALS` — Path to service account JSON (if using local GCS)

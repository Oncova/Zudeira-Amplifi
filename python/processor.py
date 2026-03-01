"""
Data processing utilities for Zuldeira Amplifi
Handles bulk asset processing, tagging, and data transformations
"""

import os
import json
from google.cloud import storage
from google.generativeai import GenerativeAI
from dotenv import load_dotenv

load_dotenv()


class AssetProcessor:
    """Utility for processing and tagging bulk assets"""

    def __init__(self):
        self.gcs_bucket = os.getenv("GCS_BUCKET_NAME", "zuldeira-amplifi-output")
        self.storage_client = storage.Client()
        self.bucket = self.storage_client.bucket(self.gcs_bucket)
        self.ai = GenerativeAI(api_key=os.getenv("GEMINI_API_KEY"))

    def list_assets(self, prefix: str = "") -> list:
        """List all assets in GCS bucket"""
        try:
            blobs = self.storage_client.list_blobs(self.gcs_bucket, prefix=prefix)
            return [blob.name for blob in blobs]
        except Exception as e:
            print(f"Error listing assets: {e}")
            return []

    def download_asset(self, asset_path: str, local_path: str) -> bool:
        """Download asset from GCS"""
        try:
            blob = self.bucket.blob(asset_path)
            blob.download_to_filename(local_path)
            return True
        except Exception as e:
            print(f"Error downloading {asset_path}: {e}")
            return False

    def upload_asset(self, local_path: str, gcs_path: str) -> str:
        """Upload asset to GCS and return public URL"""
        try:
            blob = self.bucket.blob(gcs_path)
            blob.upload_from_filename(local_path)
            blob.make_public()
            return f"https://storage.googleapis.com/{self.gcs_bucket}/{gcs_path}"
        except Exception as e:
            print(f"Error uploading {local_path}: {e}")
            return None

    def batch_tag_assets(self, image_paths: list) -> list:
        """Tag multiple images using Gemini AI"""
        tagged = []
        for path in image_paths:
            try:
                # Read image and encode to base64
                with open(path, "rb") as f:
                    image_data = f.read()
                
                # Send to Gemini for tagging
                # Note: Simplified example; adjust based on actual API
                result = {
                    "path": path,
                    "tags": ["sample", "tag"],
                    "ranking": 5
                }
                tagged.append(result)
            except Exception as e:
                print(f"Error tagging {path}: {e}")
        
        return tagged

"""
Example: Bulk asset processing
Demonstrates how to use the AssetProcessor utility
"""

from processor import AssetProcessor


def main():
    # Initialize processor
    processor = AssetProcessor()

    # List all assets in the bucket
    print("Listing assets in GCS bucket...")
    assets = processor.list_assets()
    print(f"Found {len(assets)} assets:")
    for asset in assets[:10]:  # Show first 10
        print(f"  - {asset}")

    # Upload a local file
    # Example: processor.upload_asset("local_image.jpg", "images/local_image.jpg")

    # Download an asset
    # Example: processor.download_asset("images/sample.jpg", "./downloaded_sample.jpg")

    # Batch tag assets
    # Example: tagged = processor.batch_tag_assets(["img1.jpg", "img2.jpg"])

    print("\nUtilities ready for data processing tasks!")


if __name__ == "__main__":
    main()

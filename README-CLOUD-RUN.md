Deploying the Express API to Google Cloud Run

1) Build and push the container (replace PROJECT_ID and REGION):

```bash
# Build and push image to Artifact Registry or Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/amplifi-api

# Or using Artifact Registry (recommended)
# gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/amplifi-repo/amplifi-api
```

2) Deploy to Cloud Run (replace PROJECT_ID and REGION):

```bash
gcloud run deploy amplifi-api \
  --image gcr.io/PROJECT_ID/amplifi-api \
  --platform managed \
  --region REGION \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY,GOOGLE_APPLICATION_CREDENTIALS=,GCS_BUCKET_NAME=your-bucket
```

Notes:
- You should provide `GEMINI_API_KEY` and `GCS_BUCKET_NAME` as environment variables in Cloud Run.
- For GCS access, either attach a service account to the Cloud Run service with proper permissions, or mount credentials securely.

Frontend configuration:
- When building the frontend for production, set `VITE_API_BASE` to the Cloud Run URL (e.g., https://amplifi-api-xxxx.a.run.app) so the frontend sends API requests to the Cloud Run service.

Example build & deploy workflow for frontend (locally):

```bash
VITE_API_BASE="https://amplifi-api-xxxx.a.run.app" npm run build
# Deploy static site to Cloudflare Pages or your static host
```

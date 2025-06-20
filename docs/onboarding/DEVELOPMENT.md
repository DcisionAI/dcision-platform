# Development Guide

This guide covers the local development setup and deployment process for the DcisionAI platform.

## Technology Stack

-   **Frontend**: Next.js (React)
-   **Backend Solver**: Node.js + HiGHS (via `@modelcontextprotocol/sdk`)
-   **Deployment**: Docker, Google Cloud Build, Google Cloud Run
-   **Package Manager**: Yarn

## Local Development

The local environment runs the Next.js frontend application. The backend solver service is accessed via its deployed URL on GCP.

### Prerequisites

-   Node.js (v20 or later)
-   Yarn
-   Google Cloud SDK (`gcloud`)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd dcisionai-platform
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Configure Environment Variables:**
    Copy the example environment file and fill in the required values. The most important one for local development is `NEXT_PUBLIC_SOLVER_URL`.

    ```bash
    cp config.example.env .env.local
    ```

    Your `.env.local` should look something like this:
    ```
    # The URL of the deployed solver service
    NEXT_PUBLIC_SOLVER_URL=https://solver.dcisionai.com
    
    # Other keys (OpenAI, etc.)
    OPENAI_API_KEY=sk-...
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Deployment

The platform is designed to be deployed to Google Cloud Platform as two separate Cloud Run services: `platform-dcisionai` (frontend) and `solver-service` (backend).

### One-Command Deployment

The entire deployment process is automated with a single command.

```bash
npm run deploy
```

This command executes the `scripts/deploy.sh` script, which triggers a Cloud Build pipeline defined in `cloudbuild.yaml`. The pipeline performs the following steps:
1.  Builds the Docker image for the solver service using `Dockerfile.solver`.
2.  Builds the Docker image for the frontend service using `Dockerfile`.
3.  Pushes both images to Google Container Registry.
4.  Deploys both services to their respective Cloud Run instances.

### Manual Deployment Steps

For a detailed understanding of the deployment process, refer to the `cloudbuild.yaml` file. 
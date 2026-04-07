# Cloud Computing – Lab 06: CI/CD and Services' Resilience
**Master in Computer Engineering – Mobile Computing (2025/2026)**

**Date:** 7th April 2026

## Worksheet Briefing
Based on the previous lab's source code, in this worksheet we will create a CI/CD pipeline to build and push Docker images to the GitHub Container Registry (GHCR) using GitHub Actions. In the last part, we will ensure services resilience by adding a retry and fail mechanism on the database connection and customizing the PostgreSQL service health checks.

---

## Phase 1: Fork Lab 5 Repository
Fork the previous lab repository. Your source code should include:
1. Frontend custom-built image
2. API custom-built image
3. Nginx Proxy Manager
4. MinIO
5. PostgreSQL

---

## Phase 2: Automate Build on Push
Create a GitHub Workflow (`.github/workflows/ci.yml`) that automatically builds your `frontend` and `api` images on every push to the `main` branch. 

Because developers use different computers (e.g., Apple Silicon M-chips vs. Intel/AMD), you must build images for both `linux/amd64` and `linux/arm64` architectures.

**Tips:**
1. Use `actions/checkout@v4` to checkout the repository code to the runner.
2. Use `docker/login-action@v3` to log into GHCR.
3. Use `docker/setup-qemu-action@v3` to prepare for multiple architecture builds.
4. Use `docker/setup-buildx-action@v3` to set up the advanced builder.
5. Use `docker/build-push-action@v5` to build and push each image (set `platforms: linux/amd64,linux/arm64`).

---

## Phase 3: GHCR Authentication & Visibility
To allow GitHub Actions to push images to your account, you must provide the right permissions.
1. Generate a GitHub Personal Access Token (Classic) with the `write:packages` scope.
2. Add this token as a Repository Secret (e.g., `GHCR_PAT`) and use it in your `docker/login-action` step.
3. **Important:** Once your pipeline successfully pushes the images, go to your GitHub Profile -> **Packages**, and change the visibility of both your newly built packages from **Private** to **Public**.

---

## Phase 4: Pull Images from GHCR
Now that your images are built in the cloud, update your local `docker-compose.yml` to `pull` the images directly from the GitHub Container Registry, instead of building them locally.

---

## Phase 5: Services' Resilience
The API may still struggle to connect to the database depending on the boot sequence. To mitigate this issue, we must fix both the API and Database services.

**On the API side:**
1. Add a database connection retry mechanism in your Node.js code.
2. After 5 failed retries, stop the container completely by triggering an error return code (`process.exit(1)`).

**On the Database side:**
1. Edit `docker-compose.yml` so the database service has a health check that confirms PostgreSQL is actually ready to accept connections.
```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
```

2. Update the API: Modify the API's depends_on block in docker-compose.yml to wait for the database's new health condition:

```YAML
    depends_on:
      postgres-db:
        condition: service_healthy
```
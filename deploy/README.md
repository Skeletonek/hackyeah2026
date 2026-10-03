# splot deployment

Manual deployment files for the `splot` Next.js app.

## Prerequisites

- Docker Engine with Compose plugin
- Outbound internet access to `ghcr.io`
- A GitHub personal access token (classic) with `read:packages` scope, or a GHCR pull secret

## Steps

1. Copy the example environment file and fill in the values:

   ```bash
   cp .env.example .env
   ```

2. Log in to GHCR on the server:

   ```bash
   echo <GITHUB_TOKEN> | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
   ```

3. Pull the latest image and start the container:

   ```bash
   docker compose pull
   docker compose up -d
   ```

4. Verify it is running:

   ```bash
   docker compose ps
   docker compose logs -f
   ```

## Updating

To update to the latest image after a new push:

```bash
docker compose pull
docker compose up -d
```

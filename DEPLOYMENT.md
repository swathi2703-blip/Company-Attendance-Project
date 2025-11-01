Deployment guide — Kronos (quick)

This project is a simple Node/Express app that serves static frontend files and exposes an API. It uses MongoDB (set `MONGO_URI`) and expects `JWT_SECRET` (and optionally `PORT`).

Files added:
- `Dockerfile` — containerize the app (NODE 18 Alpine, exposes port 7000).
- `.dockerignore` — exclude node_modules, .env, git, etc.
- `Procfile` — `web: npm start` for PaaS platforms that use Procfile.

ENV variables to set on the host/provider:
- MONGO_URI — your MongoDB connection string (Atlas recommended)
- JWT_SECRET — a secure secret for signing JWTs
- PORT — optional, default is 7000 used by the server

Options to deploy

1) Deploy to Render (recommended for ease)
- Create a public or private Git repo and push this project.
- On Render, create a new Web Service and connect the repo.
- Build command: `npm ci`
- Start command: `npm start`
- Set environment variables in the Render dashboard (MONGO_URI, JWT_SECRET, PORT optional).

Render manifest (optional)
---------------------------
I added `render.yaml` to this repo so Render can create the Web Service directly from the manifest. The manifest specifies a Node web service and will auto-deploy on pushes. Important notes:
- Do NOT put secrets in `render.yaml`.
- After connecting the repo in Render, open the service's Environment page and add the following environment variables:
	- `MONGO_URI` (your MongoDB connection string)
	- `JWT_SECRET` (a secure random string)
	- `PORT` (optional, default 7000)

Deploy steps using the manifest:
1. Push your repository to GitHub (or another supported Git provider).
2. In Render, create a new service and choose "Create from Repo" → select your repo.
3. When Render detects `render.yaml`, it will use the manifest and create the service. If it doesn't, you can choose "Web Service" (Node) and enter the build and start commands manually.
4. Set the environment variables on the Render dashboard (MONGO_URI, JWT_SECRET).
5. Deploy and visit your service URL. Check `https://<your-service>/api/health`.


2) Deploy using Docker (works with Azure App Service for Containers, AWS ECS, ACI, DigitalOcean App Platform)
- Build locally:

```powershell
# from project root (PowerShell)
docker build -t kronos-app:latest .
# run locally (set env vars or mount .env)
docker run -e MONGO_URI="<your-uri>" -e JWT_SECRET="<secret>" -p 7000:7000 kronos-app:latest
```

- Push to Docker Hub / Container Registry and create a service in your cloud provider pointing to the image. Configure env vars in the cloud service.

3) Azure App Service (Linux) — container or code
- Code deploy: Create Web App, set Node version 18, configure App Settings with MONGO_URI and JWT_SECRET, and push the repo (or use GitHub Actions). Start command `npm start`.
- Container: push Docker image to Azure Container Registry and point the App Service to that image.

Quick sanity checks after deploy
- Visit `https://<your-host>/api/health` and expect a JSON or 200 response from the server.
- Log in using seeded admin (`ADMIN001 / admin`) only if you seeded production DB intentionally — seed script is for local/dev testing. In production, create accounts securely.

Notes & security
- Do not commit `.env` with real credentials. Use provider secret management.
- For production, set NODE_ENV=production and consider using a process manager or run via the provider's process manager.
- For scalable production, add HTTPS termination, logging, backups, monitoring and implement rate-limits and auth hardening.

If you want, I can:
- Add a GitHub Actions workflow to build and publish a Docker image on push.
- Prepare an Azure App Service deployment template or Render guide with screenshots.
- Create a simple starter `azure-pipelines.yml` or `docker-compose.yml` for local testing.

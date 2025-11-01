Kronos — Workforce Management (forked/prepared for deploy)

This repository contains a simple Node.js + Express + MongoDB app that serves a static frontend and exposes an API for attendance and leave management.

What I prepared for you
- Updated admin UI to list checked-in employees at the top.
- Added deployment artifacts: `Dockerfile`, `.dockerignore`, `Procfile`, and `render.yaml`.
- Added `DEPLOYMENT.md` with Render, Docker and Azure instructions.
- Added GitHub Actions workflow to build and publish a Docker image to GitHub Container Registry on push (see `.github/workflows/ci.yml`).

How to push this project to your GitHub repository
1. If you haven't already, create a GitHub repository at:
   https://github.com/rithvika67/DBMS-Project

2. From the project folder run these PowerShell commands (replace the repo URL with your repo if different):

```powershell
cd 'C:\Users\kswat\OneDrive\Desktop\project'
git init
git add --all
git commit -m "Prepare project for deploy: admin improvements + deploy artifacts"
# add remote - use HTTPS or SSH depending on your setup
git remote add origin https://github.com/rithvika67/DBMS-Project.git
# push to main (create branch if not exists)
git branch -M main
git push -u origin main
```

If you prefer SSH, use ssh URL instead:

```powershell
git remote set-url origin git@github.com:rithvika67/DBMS-Project.git
git push -u origin main
```

If `git push` asks for credentials, either:
- Use the GitHub CLI `gh auth login` to authenticate, or
- Create a Personal Access Token and use it when prompted for password (with HTTPS), or
- Use SSH keys.

How CI/CD is configured
- A GitHub Actions workflow builds a Docker image and pushes it to GitHub Container Registry (ghcr.io) on push to `main`. You'll find the workflow under `.github/workflows/ci.yml`.
- To deploy to Render, connect this repo in Render and set env vars `MONGO_URI` and `JWT_SECRET`. Render will auto-deploy when it sees `render.yaml`.

If you'd like, I can:
- Run the git commands and push for you (I will need your permission and either a configured SSH key on this machine or a temporary personal access token). I don't recommend sharing tokens in chat.
- Walk you through any authentication step (SSH key, PAT, GitHub CLI) step-by-step.

Tell me whether you want me to attempt the push from this machine, or whether you'll run the push locally. If you want me to push, confirm and I'll attempt the git commands (I may be blocked by missing credentials).
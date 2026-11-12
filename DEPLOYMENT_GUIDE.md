# Deploy & Infrastructure Guide

This project is a modern React 19 application built with Vite and Firebase. Contrary to your fears, most of the infrastructure is up-to-date (Node 22, Firebase 11, Vite 5).

## 🚀 How to Deploy in Staging

There are two ways to deploy to staging:

### 1. Manual Deployment (from your computer)
Ensure you have the Firebase CLI installed (`npm install -g firebase-tools`) and you are logged in (`firebase login`).

Run the following command:
```bash
npm run deploy:staging
```
*This command will automatically build the project with staging environment variables and deploy it to the staging hosting site.*

### 2. Automatic Deployment (GitHub Actions)
The project is configured with GitHub Actions. 
- **Staging Preview**: Every time you open a **Pull Request**, an automatic preview URL is generated.
- **Production (Live)**: Every time you **Merge** code into the `main` branch, it is automatically deployed to the production site.

---

## 🛠 Project Structure (Scaffolding)

The project uses a **Feature-Based Scaffolding**, which is the current industry standard for scalable React apps:

- `/src/features`: Contains the core logic of the app, grouped by functionality (e.g., `character`, `auth`).
  - This is MUCH better than a flat component folder!
- `/src/services`: Handles persistence (Firebase, LocalStorage).
- `/src/providers`: React context providers (Auth, Character state).
- `/src/lib`: Configuration for external libraries.
- `/src/components`: Generic, reusable UI components.

## ✅ Improvements Made

1. **Fixed CI/CD**: The GitHub workflows were trying to run `npm run build`, which didn't exist. I fixed the workflows and added a fallback `build` script.
2. **Environment Modes**: Consolidated the usage of `--mode staging` and `--mode production`.
3. **Targets Configuration**: Verified that `firebase.json` correctly uses hosting targets (`staging` and `live`).
4. **Modern Types**: Ensured TypeScript recognizes Vite environment variables.

## ⚠️ Important Note
If `npm run deploy:staging` fails with a "Target not found" error, you need to link your local environment to the Firebase site once:
```bash
firebase target:apply hosting staging runica-heros-folio-staging
```

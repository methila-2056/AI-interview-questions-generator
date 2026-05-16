# AI Interview Questions Generator

## Project Structure
- `questions-generator-api/` — AWS CDK Backend (Lambda + Bedrock + API Gateway)
- `questions-generator-ui/` — React Frontend

---

## Backend Setup

```bash
cd questions-generator-api
npm install
cdk bootstrap       # first time only
cdk deploy
```

After deploy, note the `ApiEndpoint` URL from the terminal output.

---

## Frontend Setup

1. Open `questions-generator-ui/src/services/question.service.ts`
2. Replace the `API_URL` with your actual endpoint from the backend deploy:
   ```ts
   const API_URL = "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/quesgen";
   ```
3. Then run:
```bash
cd questions-generator-ui
npm install
npm start
```

Open http://localhost:3000 in your browser.

---

## How to Test

1. Click **"Copy to Input"** to load the sample job description
2. Click **"Generate Mock Interview"**
3. Wait 5–10 seconds for AI to respond
4. 5 STAR-style questions will appear below

---

## Key Fix Applied
The service function `fetchAnalyzeDescQueAIFn` accepts `GenerateRequest` object `{ hrsJobDesc: string }`, not a plain string.
The component calls it as: `fetchAnalyzeDescQueAIFn({ hrsJobDesc: jobDescription })`

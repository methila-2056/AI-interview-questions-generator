import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConversationRole,
} from "@aws-sdk/client-bedrock-runtime";

import { GenerateRequest, QuestionOutput } from "../model/quesGen.model";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

export const logger = {
  info: (m: string, d?: any) => console.log("[INFO]", m, d),
  warn: (m: string, d?: any) => console.warn("[WARN]", m, d),
  error: (m: string, d?: any) => console.error("[ERROR]", m, d),
  debug: (m: string, d?: any) => console.debug("[DEBUG]", m, d),
};

export function getAPIHeaders(headers: any) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": headers?.origin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };
}

function normalizeJD(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
}

export async function generateQuestionsFromJD(
  input: GenerateRequest
): Promise<QuestionOutput[]> {
  const jobDescription = normalizeJD(input.hrsJobDesc);

  const systemPrompt = [
    {
      text: `You are an expert technical interviewer. Your job is to generate interview questions.

STEP 1 - CHECK FOR TECHNICAL KEYWORDS:
Scan the job description for ANY of these words (case-insensitive):
react, node, nodejs, typescript, javascript, python, java, aws, azure, gcp, api, rest, restful, sql, nosql, mongodb, postgresql, mysql, database, cloud, software, developer, engineer, engineering, code, coding, programming, frontend, backend, fullstack, full-stack, full stack, devops, docker, kubernetes, git, ci/cd, microservices, serverless, lambda, spring, angular, vue, html, css, linux, networking, security, data, machine learning, ml, ai, artificial intelligence, testing, qa, mobile, android, ios, flutter, swift, kotlin, c++, c#, dotnet, php, ruby, scala, golang, terraform, ansible

STEP 2 - DECIDE:
- If ANY keyword from Step 1 is found → generate 5 technical interview questions (TECH response)
- If ZERO keywords found AND the job is clearly non-technical (cook, chef, tailor, driver, cleaner) → return NON_TECH_JD

STEP 3 - RESPOND WITH VALID JSON ONLY. No markdown. No backticks. No extra text.

For TECH jobs, respond with exactly:
{"type":"TECH","questions":[{"id":"1","question":"<STAR question>","answer":"<STAR answer>"},{"id":"2","question":"<STAR question>","answer":"<STAR answer>"},{"id":"3","question":"<STAR question>","answer":"<STAR answer>"},{"id":"4","question":"<STAR question>","answer":"<STAR answer>"},{"id":"5","question":"<STAR question>","answer":"<STAR answer>"}]}

For NON-TECH jobs, respond with exactly:
{"type":"NON_TECH_JD"}

Remember: Return ONLY the JSON object. Nothing before it. Nothing after it.`,
    },
  ];

  const messages = [
    {
      role: ConversationRole.USER,
      content: [
        {
          text: `Generate interview questions for this job description: ${jobDescription}`,
        },
      ],
    },
  ];

  const command = new ConverseCommand({
    modelId: "us.amazon.nova-micro-v1:0",
    system: systemPrompt,
    messages,
    inferenceConfig: {
      maxTokens: 1500,
      temperature: 0.3,
    },
  });

  try {
    logger.info("Calling Bedrock...");

    const response = await bedrockClient.send(command);
    const rawOutput =
      response.output?.message?.content?.[0]?.text ?? "";

    logger.debug("RAW OUTPUT:", rawOutput);

    // Strip markdown backticks if model wraps response
    const cleaned = rawOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    logger.debug("CLEANED OUTPUT:", cleaned);

    const parsed = JSON.parse(cleaned);

    if (parsed.type === "NON_TECH_JD") {
      logger.warn("Non-technical JD detected.");
      return [];
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      logger.warn("No questions array in response.");
      return [];
    }

    const result: QuestionOutput[] = parsed.questions.map((q: any) => ({
      hrsQuesId: q.id,
      hrsQuesText: q.question,
      hrsExpAns: q.answer,
    }));

    logger.info("Generated questions count:", result.length);
    return result;
  } catch (err) {
    logger.error("Error parsing Bedrock output", err);
    return [];
  }
}

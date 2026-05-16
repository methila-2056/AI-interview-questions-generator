import { GenerateRequest, QuestionOutput } from "./question.model";

// ✅ IMPORTANT: Change this URL to your actual API Gateway endpoint after deployment
const API_URL =
  "https://dle7ki4lf2.execute-api.us-east-1.amazonaws.com/prod/quesgen";

export const fetchAnalyzeDescQueAIFn = async (
  hrsJobDesc: GenerateRequest  // ✅ accepts object { hrsJobDesc: string }
): Promise<QuestionOutput[]> => {
  try {
    console.log("fetchAnalyzeDescQueAIFn payload:", hrsJobDesc);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hrsJobDesc),
    });

    const data = await response.json();
    console.log("Response from API:", data);

    if (Array.isArray(data)) {
      return data as QuestionOutput[];
    }

    console.warn("Unexpected response format, returning []:", data);
    return [];
  } catch (error) {
    console.error("Error calling API:", error);
    return [];
  }
};

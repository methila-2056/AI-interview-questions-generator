import { APIGatewayProxyHandler } from "aws-lambda";
import { generateQuestionsFromJD } from "../service/quesGen.service";
import { GenerateRequest } from "../model/quesGen.model";
import { getAPIHeaders, logger } from "../service/quesGen.service";

export const handler: APIGatewayProxyHandler = async (event: any) => {
  logger.info("Received event", { event });

  try {
    const body = JSON.parse(event.body) as GenerateRequest;
    logger.info("Parsed request body", { body });

    if (!body.hrsJobDesc) {
      logger.warn("Missing required field: hrsJobDesc");
      return {
        statusCode: 400,
        headers: getAPIHeaders(event.headers),
        body: JSON.stringify({ error: "Missing hrsJobDesc" }),
      };
    }

    logger.info("Calling generateQuestionsFromJD");
    const questions = await generateQuestionsFromJD(body);

    logger.info("Generated questions successfully", {
      count: questions.length,
    });

    return {
      statusCode: 200,
      headers: getAPIHeaders(event.headers),
      body: JSON.stringify(questions),
    };
  } catch (err: any) {
    logger.error("Error generating questions", {
      error: err.message,
      stack: err.stack,
    });
    return {
      statusCode: 500,
      headers: getAPIHeaders(event.headers),
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

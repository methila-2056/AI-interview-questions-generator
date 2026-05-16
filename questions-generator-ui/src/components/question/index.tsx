import React, { useEffect, useState } from "react";
import { fetchAnalyzeDescQueAIFn } from "../../services/question.service";
import type { QuestionOutput } from "../../services/question.model";
import styles from "./question.module.scss";

const MIN_CHAR_LIMIT = 200;
const MAX_CHAR_LIMIT = 800;

const sampleJobDescription = `Software Engineer - Full Stack
Location: Remote
Company: TechTrend Innovations

Seeking a Full Stack Software Engineer to design, develop, and maintain scalable web apps using React, Node.js, TypeScript. Work with teams to deliver quality software.

Responsibilities:
- Build front-end and back-end using React, Node.js, TypeScript.
- Create RESTful APIs, integrate third-party services.
- Ensure app performance and responsiveness.
- Join code reviews, uphold code quality.

Requirements:
- Bachelor's in Computer Science or related field.
- 3+ years in full-stack development.
- Skilled in React, Node.js, TypeScript, SQL, AWS.
- Strong problem-solving skills.`;

const JobDescriptionInput: React.FC = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear questions when textarea is emptied
  useEffect(() => {
    if (!jobDescription.trim()) {
      setQuestions([]);
      setError(null);
    }
  }, [jobDescription]);

  // Auto-clear error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jobDescription.length < MIN_CHAR_LIMIT) {
      setError(`Minimum ${MIN_CHAR_LIMIT} characters required.`);
      return;
    }
    if (jobDescription.length > MAX_CHAR_LIMIT) {
      setError(`Maximum ${MAX_CHAR_LIMIT} characters allowed.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuestions([]);

    try {
      // ✅ THE KEY FIX: pass object { hrsJobDesc: jobDescription }
      const response = await fetchAnalyzeDescQueAIFn({
        hrsJobDesc: jobDescription,
      });

      console.log("Questions received:", response);

      if (!response || response.length === 0) {
        setError(
          "Non-technical job description — no questions generated."
        );
      } else {
        setQuestions(response);
      }
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJobDescription = () => {
    setJobDescription(sampleJobDescription);
    setQuestions([]);
    setError(null);
  };

  const isButtonDisabled =
    isLoading ||
    questions.length > 0 ||
    jobDescription.length < MIN_CHAR_LIMIT ||
    jobDescription.length > MAX_CHAR_LIMIT;

  return (
    <section data-section="job-description" className={styles["job-description"]}>
      <div data-container>
        <h2>Interview with AI</h2>
        <p>
          Paste the job description to create a personalized mock interview
          experience.
        </p>

        <div data-job-description-content>
          {/* ---- Left: Sample JD ---- */}
          <div data-sample-job-description>
            <h3>Sample Job Description</h3>
            <p>Use this example to try out the mock interview generator:</p>
            <div data-sample-job-description-content>
              <pre>{sampleJobDescription}</pre>
              <button data-cta-button onClick={handleCopyJobDescription}>
                Copy to Input
              </button>
            </div>
          </div>

          {/* ---- Right: Form ---- */}
          <div data-job-description-form-wrapper>
            <form data-job-description-form onSubmit={handleSubmit}>
              <textarea
                data-input="job-description"
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setError(null);
                }}
                placeholder={`Paste the job description here (minimum ${MIN_CHAR_LIMIT}, maximum ${MAX_CHAR_LIMIT} characters)...`}
                rows={10}
                required
              />
              <p data-char-count>
                {jobDescription.length}/{MAX_CHAR_LIMIT} characters
                {jobDescription.length > 0 &&
                  jobDescription.length < MIN_CHAR_LIMIT && (
                    <span data-char-limit-message>
                      {" "}
                      (minimum {MIN_CHAR_LIMIT} characters required)
                    </span>
                  )}
              </p>

              <button
                type="submit"
                data-cta-button
                disabled={isButtonDisabled}
              >
                {isLoading ? "Generating..." : "Generate Mock Interview"}
              </button>
            </form>

            {error && <p data-error>{error}</p>}
          </div>
        </div>

        {/* ---- Generated Questions ---- */}
        {questions.length > 0 && (
          <div data-questions-list>
            <h3>Generated Questions</h3>
            <ul data-questions-list-items>
              {questions
                .filter((q) => q.hrsQuesId && q.hrsQuesText)
                .map((q, index) => (
                  <li key={q.hrsQuesId ?? index} data-question-item>
                    <div data-question-content>
                      <strong>Question {q.hrsQuesId}:</strong> {q.hrsQuesText}
                      {q.hrsExpAns && (
                        <div data-expected-answer>
                          <em>Expected Answer:</em> {q.hrsExpAns}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobDescriptionInput;

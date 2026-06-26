const Groq = require('groq-sdk');

let groqClient = null;

// Lazily initialise the client — called only after we've confirmed the API key exists
const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const EFFORT_THRESHOLDS = [
  { maxLen: 0,   label: 'XS (< 1h)' },
  { maxLen: 50,  label: 'S (1–2h)' },
  { maxLen: 150, label: 'M (half day)' },
  { maxLen: 400, label: 'L (1 day)' },
];

const estimateEffortFromLength = (description = '') => {
  const len = description.length;
  const match = EFFORT_THRESHOLDS.find((t) => len <= t.maxLen);
  return match ? match.label : 'XL (2+ days)';
};

const getFallbackDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().split('T')[0];
};

const buildFallbackResponse = (description) => ({
  estimatedEffort: estimateEffortFromLength(description),
  suggestedDueDate: getFallbackDueDate(),
  reasoning: 'AI suggestion unavailable — using default estimate',
  fallback: true,
});

const stripMarkdownFences = (text) =>
  text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const getAiEstimate = async (title, description = '') => {
  if (!process.env.GROQ_API_KEY) {
    console.warn('[groq] GROQ_API_KEY not set — returning fallback estimate');
    return buildFallbackResponse(description);
  }

  const prompt = `You are a software project estimation assistant.
Given a task title and description, respond with ONLY valid JSON (no markdown, no explanation):
{
  "estimatedEffort": "<e.g. 2h, half day, 1 day, 3 days>",
  "suggestedDueDate": "<YYYY-MM-DD, 1–14 days from today>",
  "reasoning": "<one concise sentence>"
}

Task title: ${title}
Task description: ${description || '(no description provided)'}`;

  const controller = new AbortController();
  let timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const completion = await getGroqClient().chat.completions.create(
      {
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(stripMarkdownFences(raw));

    if (!parsed.estimatedEffort || !parsed.suggestedDueDate || !parsed.reasoning) {
      throw new Error('Incomplete fields in AI response');
    }

    return {
      estimatedEffort: String(parsed.estimatedEffort),
      suggestedDueDate: String(parsed.suggestedDueDate),
      reasoning: String(parsed.reasoning),
      fallback: false,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const reason = err.name === 'AbortError' ? 'request timed out' : err.message;
    console.warn(`[groq] ${reason} — returning fallback estimate`);
    return buildFallbackResponse(description);
  }
};

module.exports = { getAiEstimate };

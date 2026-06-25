/**
 * Groq API utility with:
 * - AbortController timeout (8s)
 * - Defensive JSON parsing (strips markdown fences)
 * - Graceful fallback on any failure
 */

const Groq = require('groq-sdk');

const FALLBACK_EFFORT_MAP = [
  [0, 'XS (< 1h)'],
  [50, 'S (1–2h)'],
  [150, 'M (half day)'],
  [400, 'L (1 day)'],
  [Infinity, 'XL (2+ days)'],
];

const getFallbackEffort = (description = '') => {
  const len = description.length;
  for (const [threshold, label] of FALLBACK_EFFORT_MAP) {
    if (len <= threshold) return label;
  }
  return 'M (half day)';
};

const getFallbackDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
};

const FALLBACK_RESPONSE = (description) => ({
  estimatedEffort: getFallbackEffort(description),
  suggestedDueDate: getFallbackDueDate(),
  reasoning: 'AI suggestion unavailable — using default estimate',
  fallback: true,
});

const stripMarkdownFences = (text) => {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
};

const getAiEstimate = async (title, description = '') => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[Groq] GROQ_API_KEY not set — returning fallback');
    return FALLBACK_RESPONSE(description);
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
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // fast and currently supported
      response_format: { type: 'json_object' }
    }, { signal: controller.signal });
    
    clearTimeout(timeout);

    const rawText = chatCompletion.choices[0]?.message?.content || '{}';
    const cleaned = stripMarkdownFences(rawText);

    const parsed = JSON.parse(cleaned);

    // Validate required fields exist
    if (!parsed.estimatedEffort || !parsed.suggestedDueDate || !parsed.reasoning) {
      throw new Error('Incomplete AI response fields');
    }

    return {
      estimatedEffort: String(parsed.estimatedEffort),
      suggestedDueDate: String(parsed.suggestedDueDate),
      reasoning: String(parsed.reasoning),
      fallback: false,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.warn('[Groq] Request timed out — returning fallback');
    } else {
      console.warn('[Groq] Error:', err.message, '— returning fallback');
    }
    return FALLBACK_RESPONSE(description);
  }
};

module.exports = { getAiEstimate };

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGeminiWithContext(userQuestion, contextEntries) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Format pinned articles as context
  const contextString = contextEntries
    .map((e) => `SOURCE: ${e.title}\nCONTENT: ${e.content}`)
    .join('\n\n---\n\n');

  const prompt = `
        You are the E-Cop Wiki Assistant. 
        Analyze the following POLITICAL RESEARCH DATA and answer the user's question.
        DATA:
        ${contextString}

        QUESTION: ${userQuestion}
    `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { askGeminiWithContext };

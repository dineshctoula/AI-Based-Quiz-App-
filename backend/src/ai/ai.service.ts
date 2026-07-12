import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Question interface defines the structure of a generated question.
 * 
 * Question interface ले generate गरिएको प्रश्नको structure लाई define गर्छ।
 */
export interface GeneratedQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey.trim() !== '') {
      this.logger.log('Gemini API key found, initializing Gemini client.');
      // Gemini client initialization
      // Gemini API key भेटिएमा Google Generative AI client initialize गर्ने
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not defined in environment. Using mock generator fallback.',
      );
    }
  }

  /**
   * Generates quiz questions based on topic, difficulty, and count.
   * Falls back to mock questions if Gemini is not initialized or fails.
   * 
   * topic, difficulty, र count को आधारमा quiz questions हरू generate गर्छ।
   * यदि Gemini key छैन वा API error आएमा mock quiz generate गर्छ।
   */
  async generateQuestions(
    topic: string,
    difficulty: string,
    count: number,
  ): Promise<GeneratedQuestion[]> {
    if (this.genAI) {
      try {
        this.logger.log(`Requesting Gemini to generate ${count} questions for topic: "${topic}" (${difficulty})`);
        
        // Use gemini-1.5-flash as the standard fast and stable model
        // gemini-1.5-flash model प्रयोग गरेर छिटो र stable response प्राप्त गर्ने
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `
          Generate a list of multiple choice questions (MCQ) about the topic "${topic}" with "${difficulty}" difficulty.
          You must return a JSON object with a single key "questions" containing an array of exactly ${count} questions.
          Each question in the array must match this JSON structure:
          {
            "text": "The question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact option text that is correct (must match one of the items in options exactly)",
            "explanation": "Detailed explanation of why this answer is correct"
          }
          Ensure options are diverse, accurate, and challenging based on the difficulty level "${difficulty}".
          Ensure "correctAnswer" matches one of the items in the "options" array exactly.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        this.logger.log('Gemini API response received. Parsing JSON content.');
        const parsed = JSON.parse(responseText);

        if (parsed && Array.isArray(parsed.questions)) {
          // Validate structure of parsed questions
          const validated: GeneratedQuestion[] = parsed.questions.map((q: any) => {
            const text = q.text || 'Unnamed Question';
            const options: string[] = Array.isArray(q.options) && q.options.length === 4 
              ? q.options 
              : ['Option A', 'Option B', 'Option C', 'Option D'];
            
            // Ensure correct answer is one of the options
            let correctAnswer: string = q.correctAnswer || options[0];
            if (!options.includes(correctAnswer)) {
              // Fallback to exact match or assign options[0]
              const match = options.find((opt: string) => opt.toLowerCase() === correctAnswer.toLowerCase());
              correctAnswer = match || options[0];
            }

            const explanation = q.explanation || 'No explanation provided.';
            return { text, options, correctAnswer, explanation };
          });

          return validated.slice(0, count);
        }

        throw new Error('Invalid JSON structure returned from Gemini.');
      } catch (error) {
        this.logger.error('Gemini generation failed. Falling back to Mock Generator.', error);
        // Fallback to mock on API failure
      }
    }

    // Run fallback generator
    // Mock fallback generator run गर्ने
    return this.generateMockQuestions(topic, difficulty, count);
  }

  /**
   * Helper to generate high-quality mock questions based on topic inputs.
   * 
   * dynamic mock questions हरू बनाउने helper function।
   */
  private generateMockQuestions(
    topic: string,
    difficulty: string,
    count: number,
  ): GeneratedQuestion[] {
    this.logger.log(`Generating mock questions for topic: "${topic}" (${difficulty}, count: ${count})`);
    
    const mockQuestions: GeneratedQuestion[] = [];
    const normalizedTopic = topic.trim();

    for (let i = 1; i <= count; i++) {
      // Dynamic questions tailored to the topic
      let text = '';
      let options: string[] = [];
      let correctAnswer = '';
      let explanation = '';

      if (i === 1) {
        text = `What is the primary architectural goal of ${normalizedTopic}?`;
        options = [
          `To manage state complexity and enhance application structure in ${normalizedTopic}`,
          `To optimize lower-level networking layers exclusively`,
          `To replace compiler checks and standard syntax rules`,
          `To generate automated unit tests without developer intervention`,
        ];
        correctAnswer = options[0];
        explanation = `The primary goal of ${normalizedTopic} is to manage architecture, state, and scalability in its target environment.`;
      } else if (i === 2) {
        text = `In the context of ${normalizedTopic}, which of the following represents a standard best practice?`;
        options = [
          `Avoiding design documentation entirely`,
          `Applying separation of concerns and writing modular components`,
          `Defining all variables as global states without encapsulation`,
          `Hardcoding connection credentials inside the source code files`,
        ];
        correctAnswer = options[1];
        explanation = `Separation of concerns and modularity are fundamental design patterns applicable to ${normalizedTopic}.`;
      } else if (i === 3) {
        text = `Which of the following is considered a typical anti-pattern or code smell in ${normalizedTopic}?`;
        options = [
          `Writing unit tests for public services`,
          `Tight coupling of components and lack of dependency inversion`,
          `Using type safety annotations`,
          `Implementing rate limiting on production endpoints`,
        ];
        correctAnswer = options[1];
        explanation = `Tight coupling makes ${normalizedTopic} harder to extend, maintain, and test over time.`;
      } else if (i === 4) {
        text = `How does difficulty level (${difficulty}) affect development patterns when deploying ${normalizedTopic}?`;
        options = [
          `Difficulty settings only apply to gameplay mechanics, not architectural complexity`,
          `Higher difficulty implies solving more complex scenarios, edge cases, and optimization problems`,
          `Difficulty settings require using completely different programming languages`,
          `It has no correlation to the complexity of the domain logic`,
        ];
        correctAnswer = options[1];
        explanation = `As complexity increases, developers must focus on optimization, caching, error tolerance, and safety boundaries.`;
      } else {
        text = `What is a core benefit of using ${normalizedTopic} in modern software engineering projects?`;
        options = [
          `It guarantees zero bugs and 100% security out of the box`,
          `It improves code readability, maintainability, and team collaboration`,
          `It removes the need for database backups`,
          `It automatically compiles code into native assembly for all operating systems`,
        ];
        correctAnswer = options[1];
        explanation = `Standardizing on modern patterns like ${normalizedTopic} helps team members align, write clear abstractions, and sustain features.`;
      }

      mockQuestions.push({
        text,
        options,
        correctAnswer,
        explanation,
      });
    }

    return mockQuestions;
  }

  /**
   * AI Tutor chat session to answer user follow-up questions about a specific quiz question.
   * 
   * AI Tutor सँग कुराकानी गरेर विद्यार्थीको थप जिज्ञासाको उत्तर दिने।
   */
  async askTutor(
    questionContext: {
      text: string;
      options: string[];
      correctAnswer: string;
      selectedOption: string;
      originalExplanation: string;
    },
    message: string,
    history: { role: 'user' | 'model'; text: string }[],
  ): Promise<string> {
    const { text, options, correctAnswer, selectedOption, originalExplanation } = questionContext;

    if (this.genAI) {
      try {
        this.logger.log(`Requesting AI Tutor explanation for question: "${text}"`);

        const systemPrompt = `
You are an expert AI Tutor helping a student understand a multiple-choice question from a quiz.
Here is the context of the quiz question:
- Question: "${text}"
- Options: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}
- Correct Answer: "${correctAnswer}"
- Student's Selected Answer: "${selectedOption || 'No answer selected'}"
- Original Explanation: "${originalExplanation || 'No explanation available'}"

Your goal is to answer the student's follow-up questions regarding this question. Be concise, encouraging, and clear.
Explain the reasoning step-by-step. Keep your responses highly educational.
If the student asks in Nepalese (नेपाली) or any other language, reply in that language. 
Otherwise, write clearly and use formatting (bolding, lists, code blocks) to make your explanation readable.
`;

        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });

        // Format history for Gemini chat API
        const geminiHistory = history.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        }));

        // Start chat session with history
        const chat = model.startChat({
          history: geminiHistory,
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();
        return responseText;
      } catch (error) {
        this.logger.error('AI Tutor chat failed. Falling back to Mock Tutor.', error);
      }
    }

    // Fallback to mock tutor when Gemini is not initialized or fails
    return this.generateMockTutorResponse(text, correctAnswer, selectedOption || 'None', message);
  }

  /**
   * Helper to generate simulated AI Tutor responses when Gemini is disabled.
   * 
   * Gemini बन्द भएको बेला AI Tutor को कृत्रिम प्रतिक्रियाहरू तयार पार्ने helper.
   */
  private generateMockTutorResponse(
    questionText: string,
    correctAnswer: string,
    selectedOption: string,
    message: string,
  ): string {
    const isCorrect = correctAnswer.trim().toLowerCase() === selectedOption.trim().toLowerCase();
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('why') || lowerMessage.includes('explain') || lowerMessage.includes('किन') || lowerMessage.includes('किनभने')) {
      return `### AI Tutor Explanation (Mock | नक्कली)

Here is a detailed breakdown of the question: *"${questionText}"*

1. **The Correct Answer**: **${correctAnswer}** is the correct choice because it represents the standard paradigm and meets all constraints of the problem.
2. **Your Selection**: You chose **${selectedOption}**. ${
        isCorrect 
          ? 'This is absolutely correct! Excellent logical deduction.' 
          : `This is incorrect. While it might seem plausible, it fails to account for core limitations or architecture guidelines.`
      }
3. **Core Concept**:
   - Make sure to review the separation of concerns.
   - Decouple modules to make them easily testable.

*Note: This is a simulated response from the local mock tutor. Configure \`GEMINI_API_KEY\` to enable real AI responses.*`;
    }

    if (lowerMessage.includes('example') || lowerMessage.includes('उदाहरण')) {
      return `### AI Tutor Example (Mock | नक्कली)

Let's illustrate the concept behind the correct answer (**${correctAnswer}**) with an example:

\`\`\`typescript
// Good design: Modular and clean
class UserConfig {
  constructor(private readonly env: string) {}
  
  getDatabaseUrl() {
    return this.env === 'production' 
      ? 'postgresql://prod_db' 
      : 'postgresql://dev_db';
  }
}
\`\`\`

Using this configuration approach avoids hardcoding credentials directly inside components. This explains why it is the correct choice compared to the alternative option: **${selectedOption}**.`;
    }

    return `### AI Tutor Response (Mock | नक्कली)

I received your follow-up query: *"${message}"*

Regarding the question: *"${questionText}"*
- **Correct Answer**: \`${correctAnswer}\`
- **Your Choice**: \`${selectedOption}\`

Since there is no active Gemini API key configured in your environment, I am responding in mock mode. Please configure \`GEMINI_API_KEY\` in your \`.env\` file to receive real-time answers.`;
  }

  /**
   * Corrects a question using AI based on a flag reason.
   * 
   * फ्ल्याग गरिएको प्रश्नलाई AI को मद्दतले संशोधन गर्छ।
   */
  async correctQuestion(
    questionContext: {
      text: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    },
    flagReason: string,
  ): Promise<GeneratedQuestion> {
    if (this.genAI) {
      try {
        this.logger.log(`Requesting Gemini to correct question based on flag: "${flagReason}"`);
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `
          You are an expert quiz content moderator. You are given a multiple-choice question that has been flagged by a user as incorrect.
          
          Here is the original question context:
          - Question Text: "${questionContext.text}"
          - Options: ${JSON.stringify(questionContext.options)}
          - Correct Answer: "${questionContext.correctAnswer}"
          - Explanation: "${questionContext.explanation}"
          
          User Flag Reason / Comment: "${flagReason}"
          
          Your job is to fix the question so it is correct, accurate, clear, and fully addresses the user's feedback.
          Make sure:
          1. The options list has exactly 4 options.
          2. The correctAnswer matches one of the options exactly.
          3. The explanation explains the corrected question clearly.
          
          You must return a JSON object with this structure:
          {
            "text": "The corrected question text here",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "The exact corrected correct option text",
            "explanation": "Detailed explanation of the corrected question and answer"
          }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        if (parsed && parsed.text && Array.isArray(parsed.options) && parsed.options.length === 4) {
          let correctAnswer = parsed.correctAnswer || parsed.options[0];
          if (!parsed.options.includes(correctAnswer)) {
            const match = parsed.options.find((opt: string) => opt.toLowerCase() === correctAnswer.toLowerCase());
            correctAnswer = match || parsed.options[0];
          }
          return {
            text: parsed.text,
            options: parsed.options,
            correctAnswer,
            explanation: parsed.explanation || 'No explanation provided.'
          };
        }
        throw new Error('Invalid JSON structure returned from Gemini.');
      } catch (error) {
        this.logger.error('Gemini question correction failed. Falling back to Mock Correction.', error);
      }
    }

    // Fallback: Mock correction
    return {
      text: questionContext.text + ' (AI Corrected)',
      options: questionContext.options,
      correctAnswer: questionContext.correctAnswer,
      explanation: questionContext.explanation + `\n\n[Moderator Note: Corrected automatically in mock mode based on feedback: "${flagReason}"]`
    };
  }
}


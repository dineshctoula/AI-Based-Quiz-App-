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
            const options = Array.isArray(q.options) && q.options.length === 4 
              ? q.options 
              : ['Option A', 'Option B', 'Option C', 'Option D'];
            
            // Ensure correct answer is one of the options
            let correctAnswer = q.correctAnswer || options[0];
            if (!options.includes(correctAnswer)) {
              // Fallback to exact match or assign options[0]
              const match = options.find(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
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
}

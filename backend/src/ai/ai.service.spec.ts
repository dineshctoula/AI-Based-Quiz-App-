import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

// Create mock structures
const mockGenerateContent = jest.fn();
const mockSendMessage = jest.fn();
const mockStartChat = jest.fn().mockReturnValue({
  sendMessage: mockSendMessage,
});
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
  startChat: mockStartChat,
});

// Mock the GoogleGenerativeAI class
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      };
    }),
  };
});

describe('AiService', () => {
  let service: AiService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Reset all mock functions before each test
    jest.clearAllMocks();

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') {
          return 'fake-api-key';
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQuestions', () => {
    it('should generate questions using Gemini API when available', async () => {
      const mockResultText = JSON.stringify({
        questions: [
          {
            text: 'What is 1 + 1?',
            options: ['1', '2', '3', '4'],
            correctAnswer: '2',
            explanation: 'Basic math',
          },
        ],
      });

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockResultText,
        },
      });

      const questions = await service.generateQuestions('Math', 'Easy', 1);

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(questions).toHaveLength(1);
      expect(questions[0].text).toBe('What is 1 + 1?');
      expect(questions[0].correctAnswer).toBe('2');
    });

    it('should fallback to mock questions when Gemini API fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const questions = await service.generateQuestions('History', 'Medium', 2);

      // Verify it fell back and returned mock questions
      expect(questions).toHaveLength(2);
      expect(questions[0].text).toContain('History');
    });

    it('should fallback to mock questions when API Key is missing', async () => {
      // Create a service instance with empty key
      configService.get.mockReturnValue('');
      const mockServiceNoKey = new AiService(configService);

      const questions = await mockServiceNoKey.generateQuestions('Science', 'Hard', 3);

      expect(questions).toHaveLength(3);
      expect(questions[0].text).toContain('Science');
    });
  });

  describe('askTutor', () => {
    const questionContext = {
      text: 'What is the speed of light?',
      options: ['300k km/s', '150k km/s', '100k km/s', '50k km/s'],
      correctAnswer: '300k km/s',
      selectedOption: '300k km/s',
      originalExplanation: 'Speed of light constant',
    };

    it('should ask AI Tutor and return response', async () => {
      const mockTutorResponse = 'Light travels at approximately 300,000 km/s.';
      mockSendMessage.mockResolvedValue({
        response: {
          text: () => mockTutorResponse,
        },
      });

      const response = await service.askTutor(questionContext, 'Why is it so fast?', []);

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
        systemInstruction: expect.any(String),
      });
      expect(mockStartChat).toHaveBeenCalledWith({ history: [] });
      expect(mockSendMessage).toHaveBeenCalledWith('Why is it so fast?');
      expect(response).toBe(mockTutorResponse);
    });

    it('should fallback to mock tutor response when Gemini fails', async () => {
      mockSendMessage.mockRejectedValue(new Error('Chat failed'));

      const response = await service.askTutor(questionContext, 'explain why it is correct', []);

      expect(response).toContain('AI Tutor Explanation (Mock | नक्कली)');
      expect(response).toContain('300k km/s');
    });
  });

  describe('correctQuestion', () => {
    const questionContext = {
      text: 'Original question text',
      options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
      correctAnswer: 'Opt 1',
      explanation: 'Original explanation',
    };

    it('should correct question via Gemini when enabled', async () => {
      const mockCorrectedJson = JSON.stringify({
        text: 'Corrected question text',
        options: ['Corrected 1', 'Corrected 2', 'Corrected 3', 'Corrected 4'],
        correctAnswer: 'Corrected 2',
        explanation: 'Corrected explanation',
      });

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockCorrectedJson,
        },
      });

      const result = await service.correctQuestion(questionContext, 'typo in question');

      expect(result.text).toBe('Corrected question text');
      expect(result.correctAnswer).toBe('Corrected 2');
      expect(result.explanation).toBe('Corrected explanation');
    });

    it('should fallback to mock correction when Gemini fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Correction failed'));

      const result = await service.correctQuestion(questionContext, 'typo in question');

      expect(result.text).toBe('Original question text (AI Corrected)');
      expect(result.explanation).toContain('[Moderator Note: Corrected automatically in mock mode based on feedback: "typo in question"]');
    });
  });
});

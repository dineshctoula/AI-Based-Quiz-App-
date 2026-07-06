import { IsNotEmpty, IsString, IsInt, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * ChatMessageDto validates each message in the conversation history.
 * 
 * ChatMessageDto ले कुराकानीको इतिहासमा रहेका प्रत्येक सन्देशलाई validate गर्छ।
 */
export class ChatMessageDto {
  @IsNotEmpty({ message: 'Role is required | Role राख्नु अनिवार्य छ' })
  @IsString({ message: 'Role must be a string | Role string हुनुपर्छ' })
  @IsIn(['user', 'model'], { message: 'Role must be user or model | Role user वा model हुनुपर्छ' })
  role: 'user' | 'model';

  @IsNotEmpty({ message: 'Message text is required | Message text राख्नु अनिवार्य छ' })
  @IsString({ message: 'Message text must be a string | Message text string हुनुपर्छ' })
  text: string;
}

/**
 * AskTutorDto validates the payload when asking the AI Tutor follow-up questions.
 * 
 * AskTutorDto ले AI Tutor लाई थप प्रश्न सोध्दा आउने request body लाई validate गर्छ।
 */
export class AskTutorDto {
  @IsNotEmpty({ message: 'Question ID is required | Question ID राख्नु अनिवार्य छ' })
  @IsInt({ message: 'Question ID must be an integer | Question ID integer हुनुपर्छ' })
  questionId: number;

  @IsNotEmpty({ message: 'Message is required | Message राख्नु अनिवार्य छ' })
  @IsString({ message: 'Message must be a string | Message string हुनुपर्छ' })
  message: string;

  @IsArray({ message: 'History must be an array | History array हुनुपर्छ' })
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history: ChatMessageDto[];
}

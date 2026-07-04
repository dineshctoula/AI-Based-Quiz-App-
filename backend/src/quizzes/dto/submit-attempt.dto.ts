import { IsNotEmpty, IsArray, ValidateNested, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * AnswerDto validates each question response submitted by the user.
 * 
 * AnswerDto ले प्रयोगकर्ताले पठाएको प्रत्येक प्रश्नको उत्तरलाई validate गर्छ।
 */
export class AnswerDto {
  @IsNotEmpty({ message: 'Question ID is required | Question ID राख्नु अनिवार्य छ' })
  @IsInt({ message: 'Question ID must be an integer | Question ID integer हुनुपर्छ' })
  questionId: number;

  @IsNotEmpty({ message: 'Selected option is required | Selected option राख्नु अनिवार्य छ' })
  @IsString({ message: 'Selected option must be a string | Selected option string हुनुपर्छ' })
  selectedOption: string;
}

/**
 * SubmitAttemptDto validates the payload when submitting a quiz attempt.
 * 
 * SubmitAttemptDto ले quiz submit गर्दा आउने request body लाई validate गर्छ।
 */
export class SubmitAttemptDto {
  @IsNotEmpty({ message: 'Answers are required | Answers पठाउनु अनिवार्य छ' })
  @IsArray({ message: 'Answers must be an array | Answers array हुनुपर्छ' })
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

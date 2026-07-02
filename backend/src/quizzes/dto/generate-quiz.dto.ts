import { IsNotEmpty, IsString, IsInt, Min, Max, IsIn } from 'class-validator';

/**
 * GenerateQuizDto is used to validate the body of the AI Quiz generation request.
 * 
 * GenerateQuizDto ले quiz generate गर्दा आउने request body लाई validate गर्छ।
 */
export class GenerateQuizDto {
  @IsNotEmpty({ message: 'Topic is required | Topic राख्नु अनिवार्य छ' })
  @IsString({ message: 'Topic must be a string | Topic string हुनुपर्छ' })
  topic: string;

  @IsNotEmpty({ message: 'Difficulty is required | Difficulty छान्नु अनिवार्य छ' })
  @IsString({ message: 'Difficulty must be a string | Difficulty string हुनुपर्छ' })
  @IsIn(['Easy', 'Medium', 'Hard'], {
    message: 'Difficulty must be Easy, Medium or Hard | Difficulty Easy, Medium वा Hard हुनुपर्छ',
  })
  difficulty: string;

  @IsNotEmpty({ message: 'Question count is required | Question count राख्नु अनिवार्य छ' })
  @IsInt({ message: 'Question count must be an integer | Question count integer हुनुपर्छ' })
  @Min(1, { message: 'Must generate at least 1 question | कम्तिमा १ वटा प्रश्न हुनुपर्छ' })
  @Max(20, { message: 'Can generate at most 20 questions | बढीमा २० वटा प्रश्न मात्र generate गर्न सकिन्छ' })
  count: number;
}

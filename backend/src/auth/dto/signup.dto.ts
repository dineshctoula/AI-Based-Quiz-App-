import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * SignUpDto defines and validates the payload structure for registering a new user.
 * 
 * SignUpDto ले registration गर्दा पठाइने data को validations चेक गर्छ।
 */
export class SignUpDto {
  
  // Validation: Must be a non-empty string and a valid email format
  @IsEmail({}, { message: 'कृपया वैध इमेल ठेगाना हाल्नुहोस् (Please provide a valid email)' })
  @IsNotEmpty({ message: 'इमेल खाली हुनु हुँदैन (Email is required)' })
  email: string;

  // Validation: Must be a string with a minimum length of 6 characters
  @IsString()
  @MinLength(6, { message: 'पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)' })
  @IsNotEmpty({ message: 'पासवर्ड खाली हुनु हुँदैन (Password is required)' })
  password: string;

  // Validation: Must be a non-empty string
  @IsString()
  @IsNotEmpty({ message: 'नाम खाली हुनु हुँदैन (Name is required)' })
  name: string;
}

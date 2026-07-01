import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * LoginDto defines and validates the payload structure for user sign-in.
 * 
 * LoginDto ले login गर्दा पठाइने data को validations चेक गर्छ।
 */
export class LoginDto {
  
  // Validation: Must be a non-empty string and a valid email format
  // validation: email empty हुन हुँदैन र valid email format मा हुनुपर्छ
  @IsEmail({}, { message: 'कृपया वैध इमेल ठेगाना हाल्नुहोस् (Please provide a valid email)' })
  @IsNotEmpty({ message: 'इमेल खाली हुनु हुँदैन (Email is required)' })
  email: string;

  // Validation: Must be a string with a minimum length of 6 characters
  // validation: password empty हुन हुँदैन र कम्तिमा ६ अक्षरको हुनुपर्छ
  @IsString()
  @MinLength(6, { message: 'पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)' })
  @IsNotEmpty({ message: 'पासवर्ड खाली हुनु हुँदैन (Password is required)' })
  password: string;
}

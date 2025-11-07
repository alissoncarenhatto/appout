import { IsEmail, IsString } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'email inválido' })
  email: string

  @IsString()
  password: string
}

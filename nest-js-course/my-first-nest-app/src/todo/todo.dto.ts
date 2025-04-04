// import { IsEmail, IsNotEmpty } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

export class createTodo {
  @IsNotEmpty({ message: 'title toh chahiye hi chahiye' })
  // name: string;
  title: string;
  // @IsEmail()
  @IsNotEmpty({ message: 'desc toh chahiye hi chahiddye' })
  // email: string;
  desc: string;
}

export class updateTodo {
  @IsNotEmpty({ message: 'title toh chahiye hi chahiye' })
  // name: string;
  title: string;
  // @IsEmail()
  @IsNotEmpty({ message: 'desc toh chahiye hi chahiye' })
  // email: string;
  desc: string;
}

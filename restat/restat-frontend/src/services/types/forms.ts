export namespace FormsTypes {

  export interface ForgotPasswordFormValues {
    email: string;
  }

  export interface SignInFormValues extends ForgotPasswordFormValues {
    password: string;
  }

  export interface SignUpFormValues extends SignInFormValues {
    fullName: string;
    confirmPassword: string;
    phoneNumber: string;
  }

  export interface ChangePasswordFormValues {
    password: string;
    confirmPassword: string;
  }
}
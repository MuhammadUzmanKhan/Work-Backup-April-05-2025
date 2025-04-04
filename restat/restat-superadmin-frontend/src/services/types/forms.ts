export namespace FormsTypes {

    export interface ForgotPasswordFormValues {
        email: string;
    }

    export interface SignInFormValues extends ForgotPasswordFormValues {
        password: string;
    }

}
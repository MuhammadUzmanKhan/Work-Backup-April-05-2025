import * as Yup from 'yup';
import { categoryValidator, checkBoxValidator, confirmPasswordValidator, emailValidator, minCharacterValidator, nameValidator, passwordValidator, descriptionValidator, portfolioNameValidator, linkValidator, userNameValidator, upworkClientEmailValidator, urlValidator, phoneNumberValidator, minMaxCharacterValidator} from './validators';

const signUpValidationSchema = Yup.object().shape({
    fullName: nameValidator,
    email: emailValidator(),
    password: passwordValidator,
    confirmPassword: confirmPasswordValidator,
    phoneNumber: phoneNumberValidator
})

const signInValidationSchema = Yup.object().shape({
    email: emailValidator(),
    password: minCharacterValidator
})

const editUpworkClientAccountValidationSchema = Yup.object().shape({
  email: upworkClientEmailValidator,
})

const forgotPasswordValidationSchema = Yup.object().shape({
    email: emailValidator()
})

const changePasswordValidationSchema = Yup.object().shape({
    password: passwordValidator,
    confirmPassword: confirmPasswordValidator
})

const onBoardingValidationSchemaStep2 = Yup.object().shape({
    name: minCharacterValidator
})

const onBoardingValidationSchemaStep5 = Yup.object().shape({
    categories: categoryValidator
});

const onBoardingValidationSchema = Yup.object().shape({
    name: minCharacterValidator,
    categories: categoryValidator
})

const membersValidationSchema = Yup.object().shape({
    members: Yup.array().of(
        Yup.object().shape({
            name: minMaxCharacterValidator("full name",2,50,"Please provide the full name of your team member."),
            email:  emailValidator("Please provide a valid email address of your team member."),
            role: checkBoxValidator,
        })
    )
})

const portfoliosValidationSchema = Yup.object().shape({
  name: portfolioNameValidator,
  description: descriptionValidator,
  links: Yup.array().of(linkValidator),
});

const codeTextSnippetsValidationSchema = Yup.object().shape({
  name: portfolioNameValidator,
  description: descriptionValidator,
})

const userValidationSchema = Yup.object().shape({
  name: userNameValidator,
  email: emailValidator(),
  upworkTarget: Yup.number(), 
  linkedinTarget: Yup.number(), 
})
const profileValidationSchema = Yup.object().shape({
  name: userNameValidator,
  url: urlValidator,
})
export {
    signUpValidationSchema,
    signInValidationSchema,
    forgotPasswordValidationSchema,
    changePasswordValidationSchema,
    onBoardingValidationSchemaStep2,
    onBoardingValidationSchemaStep5,
    onBoardingValidationSchema,
    membersValidationSchema,
    portfoliosValidationSchema,
    codeTextSnippetsValidationSchema,
    userValidationSchema,
    editUpworkClientAccountValidationSchema,
    profileValidationSchema
}
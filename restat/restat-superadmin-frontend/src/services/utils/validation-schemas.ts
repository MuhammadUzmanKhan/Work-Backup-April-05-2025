import * as Yup from 'yup';
import { emailValidator, minCharacterValidator } from './validators';



const signInValidationSchema = Yup.object().shape({
    email: emailValidator,
    password: minCharacterValidator
})


export {
    signInValidationSchema,
}
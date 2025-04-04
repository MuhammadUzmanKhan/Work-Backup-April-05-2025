import * as Yup from "yup";

//min 4 characters, no numeric and special characters are allowed except space.
const fullNameRules = /^[A-Za-z ]+$/;

// min 8 characters, 1 upper case letter, 1 lower case letter, 1 numeric digit.
const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

export const requiredString = Yup.string().required(
  "You can not leave this empty"
);
export const nameValidator = requiredString
  .matches(fullNameRules, {
    message: "No numeric and special characters are allowed except spaces.",
  })
  .max(15, "Must be 15 characters or less")
  .min(4, "Must be at least 4 characters or more.");
  export const emailValidator = (customMessage?: string) =>
    Yup.string()
      .email(customMessage || "Please provide a valid email address.")
      .required(customMessage || "This field is required. Please provide an email address.");
  
  
export const phoneNumberValidator = Yup.number()
  .required("Phone number is required.");
export const upworkClientEmailValidator = Yup.string().email()
export const passwordValidator = requiredString
  .min(
    8,
    "Min 8 characters, 1 upper case letter, 1 lower case letter, 1 numeric digit."
  )
  .matches(passwordRules, { message: "Please create a stronger password." });
export const minCharacterValidator = requiredString
  .min(8, "Min 8 characters required.")
  .required("Please fill out that field");
  
export const confirmPasswordValidator = requiredString.oneOf(
  [Yup.ref("password")],
  "Password and confirmPassword must match"
);
export const minMaxCharacterValidator = (
  fieldName: string,
  min = 2,
  max = 50,
  requiredMessage?: string
) =>
  Yup.string()
    .min(min, `The ${fieldName} should be at least ${min} characters long. Please try again.`)
    .max(max, `The ${fieldName} can be up to ${max} characters.`)
    .required(requiredMessage || `Please fill out that field`);

export const urlValidator = Yup.string().matches(
  /((https?):\/\/)?(www\.)?[a-z0-9!#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9!#$%&'()*+,\-./:;<=>?@[\]^_`{|}~#]*)*\/?(\?[a-zA-Z0-9!#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]*=[a-zA-Z0-9!#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]*&?)?$/,
  "Enter correct url!"
).required("Please fill out that field");

export const categoryValidator = Yup.array()
  .min(1, "Select at least one option")
  .required("At least one option is required");
export const checkBoxValidator = Yup.string().required(
  "You must assign at least one role"
);
export const tagValidator = Yup.object().shape({
  id: Yup.string().required("Tag ID is required"),
  name: Yup.string().required("Tag name is required"),
  description: Yup.string().required("Tag description is required"),
});

export const portfolioNameValidator = Yup.string().required("Name is required")
export const descriptionValidator = Yup.string().required("Description is required");
export const linkValidator = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  url: Yup.string().url('Invalid URL format').required("URL is required"),
});
export const userNameValidator = requiredString
  .matches(fullNameRules, {
    message: "No numeric and special characters are allowed except spaces.",
  })
  .max(30, "Must be 15 characters or less")
  .min(3, "Must be at least 3 characters or more.");


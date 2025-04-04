const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_REGEX_MESSAGE = "Password must be at least 8 characters long, must have atleast one upper-case letter, lower-case letter, number and special character.";

export const REGEX = {
    PASSWORD_REGEX
};

export const VALIDATION_MESSAGES = {
    PASSWORD_REGEX_MESSAGE
};
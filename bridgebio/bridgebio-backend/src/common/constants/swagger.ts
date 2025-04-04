export const swagger = {
    title: 'Bridge Bio API',
    description: 'This is the API documentation for Bridge Bio. You need a valid authorization token to acces the end points.',
    version: '1.0.0'
};

export const RESPONSES = {
    SUPER_ADMIN_CREATED: 'Super Admin Created',
    INVALID_ADMIN_KEY: 'You need valid admin secret key',
    USER_REGISTERED: 'User registered successfully',
    USER_LOGGED_IN: 'User logged in successfully',
    INVALID_CREDENTIALS: "Invalid Credentials",
    UPDATION_SUCCESSFUL: 'Updation Successful',
    UNAUTHORIZED: "You are not authorized to access this resource",
    NOT_FOUND: "Requested resource not found"

};

export enum ApiTagNames {
    PUBLIC = "Public",
    HEALTH = "Health Check",
    AUTHENTICATION = "Authentication",
    USERS = "Users",
    MEDICINES = "Medicines",
    StrategyAndTreatment = "Strategy And Treatment",
    SUPER_ADMIN = "Super Admin"
};
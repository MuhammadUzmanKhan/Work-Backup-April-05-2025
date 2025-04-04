export const generateRandomSigninCredentials = (env: string) => {
    if (env === "local") return {
        email: `superadmin@yopmail.com`,
        password: '12345678',
    }
    return {
        email: "",
        password: "",
    }
}
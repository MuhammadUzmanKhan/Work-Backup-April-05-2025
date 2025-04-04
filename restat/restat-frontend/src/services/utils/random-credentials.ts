export const generateRandomSigninCredentials = (env: string) => {
  if (env === "local") return {
    fullName: (Math.random() + 1).toString(36).substring(7),
    email: `${(Math.random() + 1).toString(36).substring(7)}@mailinator.com`,
    password: 'Test@1234',
    confirmPassword: 'Test@1234',
    phoneNumber: `+1111111`
  }
  return {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: ""
  }
}
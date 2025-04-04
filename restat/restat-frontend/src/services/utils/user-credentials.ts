export const generateRandomUserCredentials = (env: string) => {
  if (env === "local") return {
      name: (Math.random() + 1).toString(36).substring(7),
      email: `${(Math.random() + 1).toString(36).substring(7)}@mailinator.com`,
  }
  return {
      name: "",
      email: "",
  }
}
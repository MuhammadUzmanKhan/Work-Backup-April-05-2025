
export const formatTitle = (type: string) => {
  // covert "CODE_SNIPPET" to "Code Snippet"
  return type
    .split("_")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
};

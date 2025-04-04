
const cleanAndTrimWhitespace = (input: string): string => {
  let trimmed = input.trim();

  // Remove multiple spaces and replace them with a single space
  trimmed = trimmed.replace(/\s+/g, ' ');


  return trimmed;
};

export default cleanAndTrimWhitespace;

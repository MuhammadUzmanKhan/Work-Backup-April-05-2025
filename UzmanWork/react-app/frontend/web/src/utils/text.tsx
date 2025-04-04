export function replaceForFuzzySearch(inputString: string): string {
  // replace similar characters with numbers to enable fuzzy search
  return inputString
    .toUpperCase()
    .replaceAll("O", "0")
    .replaceAll("Q", "0")
    .replaceAll("I", "1")
    .replaceAll("L", "1")
    .replaceAll("G", "6")
    .replaceAll("S", "5")
    .replaceAll("B", "8");
}

// Calculate the maximum number of consecutive matches of a substring in a string
// Example:
// maxConsecutiveMatches("abc", "abc") = 3
// maxConsecutiveMatches("abc", "ab") = 2
// maxConsecutiveMatches("abc", "bc") = 2
export function maxConsecutiveMatches(
  inputString: string,
  searchString: string
) {
  let maxNumMatches = 0;
  for (let len = 1; len <= searchString.length; len++) {
    let updated = false;
    // loop through all substrings of length len
    for (let i = 0; i < searchString.length - len + 1; i++) {
      const subSearchString = searchString.slice(i, i + len);
      if (inputString.includes(subSearchString)) {
        maxNumMatches = len;
        updated = true;
        break;
      }
    }
    // skip for longer substrings if no matches were found
    if (!updated) {
      break;
    }
  }
  return maxNumMatches;
}

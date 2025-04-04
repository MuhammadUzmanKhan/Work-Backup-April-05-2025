/**
 * This file contains all the helper functions related to format data in different cases.
 */

//
//

/**
 * 1- str.split('_'): This method splits the string into an array of words, using underscores as the separator
 * 2- .map((word) => word.charAt(0).toUpperCase() + word.slice(1)): This method iterates over each word in the array and capitalizes the first letter of each word
 * 3- .join(' '): This method joins the words back together into a single string, with spaces between each word.
 * For example, if the input string is 'hello_world', the function will return 'Hello World'.
 * @param str takes a string parameter str
 * @returns returns a humanized title case version of the string.
 */
export const humanizeTitleCase = (str: string): string => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * It will take an enum of any type and convert its all keys into humanizeTitleCase and return an array of formatted strings
 * @param _enum
 * @returns
 */
export const getHumanizeTitleCaseEnum = (_enum: any): string[] => {
  return Object.keys(_enum)
    .filter((key) => isNaN(+key))
    .map((key) => humanizeTitleCase(key.toLowerCase()));
};

/**
 *
 * @param str i.e "hello world" , "hello-world"
 * @returns i.e. hello_world
 */
export const convertStringToSnakeCase = (str: string): string => {
  return str.toLowerCase().replace(/[\s-]+/g, '_');
};

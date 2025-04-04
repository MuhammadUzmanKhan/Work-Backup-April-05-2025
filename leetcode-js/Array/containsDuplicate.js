// 217. Contains Duplicate
// Solved
// Easy
// Topics
// Companies
// Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.

// Example 1:

// Input: nums = [1,2,3,1]
// Output: true
// Example 2:

// Input: nums = [1,2,3,4]
// Output: false
// Example 3:

// Input: nums = [1,1,1,3,3,4,3,2,4,2]
// Output: true

// Constraints:

// 1 <= nums.length <= 105
// -109 <= nums[i] <= 109

/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function (nums) {
  let seen = new Set();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(nums[i])) {
      return true;
    }
    seen.add(nums[i]);
  }
  return false;
};

// Explanation:
// Initialize a Set:

// A Set is used because it stores only unique elements, making it ideal for checking duplicates.
// Iterate Through the Array:

// For each number in the array, check if it is already in the seen set.
// If it is, return true immediately because a duplicate has been found.
// If not, add the number to the seen set and continue.
// Return the Result:

// If the loop completes without finding any duplicates, return false.

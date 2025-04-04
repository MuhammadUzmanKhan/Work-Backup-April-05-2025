// Code
// Testcase
// Testcase
// Test Result
// 152. Maximum Product Subarray
// Solved
// Medium
// Topics
// Companies
// Given an integer array nums, find a
// subarray
//  that has the largest product, and return the product.

// The test cases are generated so that the answer will fit in a 32-bit integer.

// Example 1:

// Input: nums = [2,3,-2,4]
// Output: 6
// Explanation: [2,3] has the largest product 6.
// Example 2:

// Input: nums = [-2,0,-1]
// Output: 0
// Explanation: The result cannot be 2, because [-2,-1] is not a subarray.

// Constraints:

// 1 <= nums.length <= 2 * 104
// -10 <= nums[i] <= 10
// The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.

/**
 * @param {number[]} nums
 * @return {number}
 */
var maxProduct = function (nums) {
  if (nums.length === 0) return 0;
  let minProduct = nums[0];
  let maxProduct = nums[0];
  let result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    num = nums[i];
    if (num < 0) [maxProduct, minProduct] = [minProduct, maxProduct];

    maxProduct = Math.max(num, maxProduct * num);
    minProduct = Math.min(num, minProduct * num);

    result = Math.max(result, maxProduct);
  }
  return result;
};

// Initialization:

// Start by setting maxProduct, minProduct, and result to the first element in the array (nums[0]).
// Iterate Through the Array:

// For each element in the array starting from the second one:
// If the current element is negative, swap maxProduct and minProduct because a negative number can turn a large positive product
//  into a large negative product and vice versa.
// Update maxProduct to be the maximum between the current element and the product of maxProduct with the current element.
// Update minProduct to be the minimum between the current element and the product of minProduct with the current element.
// Update the Result:

// After calculating the maxProduct for the current element, update result to ensure it holds the maximum product encountered so far.
// Finally, return result as it contains the largest product of any subarray.

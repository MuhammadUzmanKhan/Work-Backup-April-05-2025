// 53. Maximum Subarray
// Solved
// Medium
// Topics
// Companies
// Given an integer array nums, find the
// subarray
//  with the largest sum, and return its sum.

// Example 1:

// Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
// Output: 6
// Explanation: The subarray [4,-1,2,1] has the largest sum 6.
// Example 2:

// Input: nums = [1]
// Output: 1
// Explanation: The subarray [1] has the largest sum 1.
// Example 3:

// Input: nums = [5,4,-1,7,8]
// Output: 23
// Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.

// Constraints:

// 1 <= nums.length <= 105
// -104 <= nums[i] <= 104

// Follow up: If you have figured out the O(n) solution, try coding another solution using the divide and conquer approach, which is more subtle

/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function (nums) {
  let sum = 0;
  let max = nums[0];
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    if (sum > max) {
      max = sum;
    }
    if (sum < 0) {
      sum = 0;
    }
  }
  return max;
};

//Explanation:
// 1.Iterates through the array, continuously adding each element to a running sum (sum) and
//  updating the maximum sum (max) whenever the current sum exceeds the previous maximum.
// 2.If the running sum (sum) becomes negative, it is reset to 0, ensuring that future sub-arrays
// start fresh without carrying over a negative value.
// 3. initializing max with the first element of the array, your solution correctly
// handles cases where all elements are negative, returning the largest element.

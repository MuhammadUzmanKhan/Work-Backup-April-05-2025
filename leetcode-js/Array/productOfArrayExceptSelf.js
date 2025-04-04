// 238. Product of Array Except Self
// Solved
// Medium
// Topics
// Companies
// Hint
// Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

// The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.

// You must write an algorithm that runs in O(n) time and
//  ******without using the division operation.******

// Example 1:

// Input: nums = [1,2,3,4]
// Output: [24,12,8,6]
// Example 2:

// Input: nums = [-1,1,0,-3,3]
// Output: [0,0,9,0,0]

// Constraints:

// 2 <= nums.length <= 105
// -30 <= nums[i] <= 30
// The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.

// Follow up: Can you solve the problem in O(1) extra space complexity? (The output array does not count as extra space for space complexity analysis.)

var productExceptSelf = function (nums) {
  const len = nums.length;
  const forwardingArray = new Array(len).fill(1);
  const reversingArray = new Array(len).fill(1);
  let forwardArray = 1; // [1 1 2 6] forwarding Array
  for (let i = 0; i < len; i++) {
    forwardingArray[i] = forwardArray;
    forwardArray *= nums[i];
  }
  // [ 24 12 4 1] reversing Array
  let reverseArray = 1;
  for (let i = len - 1; i >= 0; i--) {
    reversingArray[i] = reverseArray;
    reverseArray *= nums[i];
  }
  // resulting array [24 12 8 6]
  const results = new Array(len);
  for (let i = 0; i < len; i++) {
    results[i] = forwardingArray[i] * reversingArray[i];
  }
  return results;
};

// Explanation:

// Step 1: Forward Pass (Calculate Prefix Products)
// Initialize a forwardingArray with all elements as 1.
// As you iterate through the array from left to right, multiply each element
//  with a running product (forwardArray) and store it in forwardingArray.
// Step 2: Reverse Pass (Calculate Suffix Products)
// Similarly, initialize a reversingArray with all elements as 1.
// Iterate through the array from right to left, multiply each element
//  with a running product (reverseArray) and store it in reversingArray.
// Step 3: Calculate Final Results
// Multiply the corresponding elements of forwardingArray
//  and reversingArray to get the final product for each position.

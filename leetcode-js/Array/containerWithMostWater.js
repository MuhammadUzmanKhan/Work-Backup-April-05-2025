// You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

// Find two lines that together with the x-axis form a container, such that the container contains the most water.

// Return the maximum amount of water a container can store.

// Notice that you may not slant the container.
// Example 1:

// Input: height = [1,8,6,2,5,4,8,3,7]
// Output: 49
// // Explanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7].
// // In this case, the max area of water (blue section) the container can contain is 49.
// // Example 2:

// Input: height = [1,1]
// Output: 1

/**
 * @param {number[]} height
 * @return {number}
 */

var maxArea = function (height) {
  let area = 0,
    i = 0;
  j = height.length - 1;

  while (i < j) {
    const temp = (j - i) * Math.min(height[i], height[j]);
    area = Math.max(area, temp);

    if (height[i] > height[j]) {
      j -= 1;
    } else {
      i += 1;
    }
  }
  return area;
};

// Input: `height = [1,8,6,2,5,4,8,3,7]`

// ### Initialization
// - `area = 0`
// - `i = 0` (pointing to height[0] = 1)
// - `j = 8` (pointing to height[8] = 7)

// ### Iterations

// **First Iteration:**
// - `temp = (j-i) × min(height[i], height[j])`
// - `temp = (8-0) × min(1,7) = 8 × 1 = 8`
// - Update `area = max(0, 8) = 8`
// - Move `i` since height[i] < height[j], now `i = 1`

// **Second Iteration:**
// - `temp = (8-1) × min(8,7) = 7 × 7 = 49`
// - Update `area = max(8, 49) = 49`
// - Move `j` since height[i] > height[j], now `j = 7`

// **Third Iteration:**
// - `temp = (7-1) × min(8,3) = 6 × 3 = 18`
// - Update `area = max(49, 18) = 49`
// - Move `j` since height[i] > height[j], now `j = 6`

// **Fourth Iteration:**
// - `temp = (6-1) × min(8,8) = 5 × 8 = 40`
// - Update `area = max(49, 40) = 49`
// - Move `j` since height[i] = height[j], now `j = 5`

// **Fifth Iteration:**
// - `temp = (5-1) × min(8,4) = 4 × 4 = 16`
// - Update `area = max(49, 16) = 49`
// - Move `j`, now `j = 4`

// **Sixth Iteration:**
// - `temp = (4-1) × min(8,5) = 3 × 5 = 15`
// - Update `area = max(49, 15) = 49`
// - Move `j`, now `j = 3`

// **Seventh Iteration:**
// - `temp = (3-1) × min(8,2) = 2 × 2 = 4`
// - Update `area = max(49, 4) = 49`
// - Move `j`, now `j = 2`

// **Eighth Iteration:**
// - `temp = (2-1) × min(8,6) = 1 × 6 = 6`
// - Update `area = max(49, 6) = 49`
// - Move `j`, now `j = 1`

// ### Final Result
// The loop ends because `i ≥ j`
// Maximum area found: **49**

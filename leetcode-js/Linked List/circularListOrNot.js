// Given head, the head of a linked list, determine if the linked list has a cycle in it.

// There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer.
// Internally, pos is used to denote the index of the node that tail's next pointer is connected to. Note that pos is not passed as a parameter.

// Return true if there is a cycle in the linked list. Otherwise, return false.

// Example 1:

// Input: head = [3,2,0,-4], pos = 1
// Output: true
// Explanation: There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).
// Example 2:

// Input: head = [1,2], pos = 0
// Output: true
// Explanation: There is a cycle in the linked list, where the tail connects to the 0th node.
// Example 3:

// Input: head = [1], pos = -1
// Output: false
// Explanation: There is no cycle in the linked list.

// Constraints:

// The number of the nodes in the list is in the range [0, 104].
// -105 <= Node.val <= 105
// pos is -1 or a valid index in the linked-list.

/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head - The head of the linked list
 * @return {boolean} - Returns true if there is a cycle, false otherwise
 */

// Summary:
// Time Complexity: O(n)
// Space Complexity: O(1)
var hasCycle = function (head) {
  let fast = head; // Initialize a fast pointer to the head of the list
  // Loop until fast pointer reaches the end of the list
  while (fast && fast.next) {
    head = head.next; // Move the slow pointer one step forward
    fast = fast.next.next; // Move the fast pointer two steps forward
    // Check if the slow pointer and fast pointer meet
    if (head === fast) return true; // Cycle detected
  }
  return false; // No cycle detected
};

// Given the head of a singly linked list, reverse the list, and return the reversed list.

// Example 1:

// Input: head = [1,2,3,4,5]
// Output: [5,4,3,2,1]
// Example 2:

// Input: head = [1,2]
// Output: [2,1]
// Example 3:

// Input: head = []
// Output: []

// Constraints:

// The number of nodes in the list is the range [0, 5000].
// -5000 <= Node.val <= 5000

// Follow up: A linked list can be reversed either iteratively or recursively. Could you implement both?

class Solution {
  reverseList(head) {
    // Initialize pointers
    let prev = null; // Previous node starts as null
    let curr = head; // Current node starts at the head

    // Traverse the list
    while (curr !== null) {
      let next = curr.next; // Save the next node

      curr.next = prev; // Reverse the link

      // Move pointers forward
      prev = curr; // Move prev to the current node
      curr = next; // Move curr to the next node
    }

    // prev is now the new head of the reversed list
    return prev;
  }
}

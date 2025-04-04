import React from "react";
import { useUserContext } from "../context/UserContext";

const UserList: React.FC = () => {
  const { state, dispatch } = useUserContext();
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">User List</h2>
      <ul>
        {state.users.map((user) => (
          <li key={user.id} className="mb-2 p-2 bg-gray-100 rounded-md">
            {user.firstName} {user.lastName}{" "}
            <button
              onClick={() => {
                dispatch({ type: "UPDATE_USER", payload: user });
                dispatch({ type: "SHOW_FORM", payload: true });
              }}
              className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-700"
            >
              Edit User
            </button>
            <button
              onClick={() => {
                dispatch({ type: "DELETE_USER", payload: user.id });
              }}
              className="ml-2 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700"
            >
              Delete
            </button>{" "}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button
          onClick={() => dispatch({ type: "SHOW_FORM", payload: true })}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Add
        </button>{" "}
      </div>
    </div>
  );
};

export default UserList;

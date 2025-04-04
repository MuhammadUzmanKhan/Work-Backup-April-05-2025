import React, { useEffect, useState } from "react";
import { User, useUserContext } from "../context/UserContext";
import { cities } from "../data/cities";

const initialUser = {
  id: 0,
  firstName: "",
  lastName: "",
  photo: "",
  gender: "Male",
  email: "",
  mobileNo: "",
  dob: "",
  city: "",
  skills: [] as string[],
};

const UserForm: React.FC = () => {
  const { state, dispatch } = useUserContext();
  const [user, setUser] = useState(state.form);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    // Handle text inputs and select
    if (type !== "file") {
      setUser({ ...user, [name]: value });
    } else {
      // Handle image input
      const file = (e.target as HTMLInputElement).files?.[0];

      if (file) {
        setUser({ ...user, [name]: file });
      }
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setUser({
      ...user,
      skills: e.target.checked
        ? [...user.skills, value]
        : user.skills.filter((skill) => skill !== value),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (user.id === 0) {
      dispatch({
        type: "ADD_USER",
        payload: {
          ...user,
          gender: user.gender as "Male" | "Female",
          id: state.users.length + 1, // Assign a unique ID
        },
      });
    } else {
      dispatch({
        type: "UPDATE_USER",
        payload: {
          ...user,
          gender: user.gender as "Male" | "Female",
        },
      });
    }

    setUser(initialUser as User);
  };

  const validateForm = () => {
    return (
      user.firstName &&
      user.lastName &&
      user.email &&
      user.mobileNo.length === 10
    );
  };

  useEffect(() => {
    setUser(state.form);
  }, [state.form]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500">
      {state.open && (
        <div className="max-w-md mx-auto mt-4 p-6 bg-white shadow-md rounded-md">
          <h2 className="text-2xl font-semibold mb-4"> User Form </h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "SHOW_FORM", payload: false })}
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={user.firstName}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={user.lastName}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Photo
              </label>
              <input
                type="file"
                accept="image/*"
                name="photo"
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Gender
              </label>
              <div className="mt-1">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={user.gender === "Male"}
                    onChange={handleChange}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Male</span>
                </label>

                <label className="inline-flex items-center ml-6">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={user.gender === "Female"}
                    onChange={handleChange}
                    className="form-radio h-4 w-4 text-pink-600"
                  />
                  <span className="ml-2">Female</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Mobile No
              </label>
              <input
                type="tel"
                name="mobileNo"
                value={user.mobileNo}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                pattern="[0-9]{10}"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={user.dob}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                City
              </label>
              <select
                name="city"
                value={user.city}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Professional Skills
              </label>
              <div className="space-x-4">
                {[
                  "Communication",
                  "Critical Thinking",
                  "Problem Solving",
                  "Initiative",
                ].map((skill) => (
                  <label key={skill} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill}
                      checked={user.skills.includes(skill)}
                      onChange={handleCheckboxChange}
                      className="form-checkbox text-blue-500"
                    />
                    <span className="ml-2 text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:shadow-outline-blue"
              onClick={() => console.log("Clickedd  d")}
            >
              Save
            </button>
            <button
              onClick={() => dispatch({ type: "RESET_FORM" })}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Reset Form
            </button>{" "}
          </form>
        </div>
      )}
    </div>
  );
};

export default UserForm;

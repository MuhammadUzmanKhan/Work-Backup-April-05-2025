export default function App() {
  return <h1>Hello world</h1>;
}

// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vitejs.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

// import React, { useState } from 'react';

// interface FormData {
//   name: string;
//   experience: string;
// }

// interface DynamicFormProps {
//   initialFormData: FormData[];
// }

// const DynamicForm: React.FC<DynamicFormProps> = ({ initialFormData }) => {
//   const [formFields, setFormFields] = useState<FormData[]>(initialFormData);

//   const addField = () => {
//     setFormFields((prevFields) => [...prevFields, { name: '', experience: '' }]);
//   };

//   const removeField = (index: number) => {
//     setFormFields((prevFields) => prevFields.filter((_, i) => i !== index));
//   };

//   const handleFieldChange = (index: number, fieldName: string, value: string) => {
//     setFormFields((prevFields) =>
//       prevFields.map((field, i) =>
//         i === index ? { ...field, [fieldName]: value } : field
//       )
//     );
//   };

//   return (
//     <div>
//       {formFields.map((formData, index) => (
//         <div key={index}>
//           <input
//             type="text"
//             name="name"
//             placeholder="Name"
//             value={formData.name}
//             onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
//           />
//           <input
//             type="text"
//             name="experience"
//             placeholder="Experience"
//             value={formData.experience}
//             onChange={(e) =>
//               handleFieldChange(index, 'experience', e.target.value)
//             }
//           />
//           <button onClick={addField}>+</button>
//           <button onClick={() => removeField(index)}>-</button>
//         </div>
//       ))}
//     </div>
//   );
// };

// function App() {
//   return (
//     <div className="App">
//       <DynamicForm initialFormData={[{ name: '', experience: '' }]} />
//     </div>
//   );
// }

// export default App;

// import React, { useState } from "react";
// import { Button, TextField, Grid } from "@mui/material";
// import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material"; // Make sure to import the icons you want to use

// interface FormData {
//   name: string;
//   experience: string;
// }

// interface DynamicFormProps {
//   initialFormData: FormData[];
// }

// const DynamicForm: React.FC<DynamicFormProps> = ({ initialFormData }) => {
//   const [formFields, setFormFields] = useState<FormData[]>(initialFormData);

//   const addField = () => {
//     setFormFields([...formFields, { name: "", experience: "" }]);
//   };

//   const removeField = (index: number) => {
//     const updatedFields = [...formFields];
//     updatedFields.splice(index, 1);
//     setFormFields(updatedFields);
//   };

//   return (
//     <div>
//       {formFields.map((formData, index) => (
//         <Grid container spacing={2} key={index}>
//           <Grid item xs={5}>
//             <TextField
//               name="name"
//               placeholder="Name"
//               value={formData.name}
//               onChange={(e) => {
//                 const updatedFields = [...formFields];
//                 updatedFields[index].name = e.target.value;
//                 setFormFields(updatedFields);
//               }}
//               fullWidth
//             />
//           </Grid>
//           <Grid item xs={5}>
//             <TextField
//               name="experience"
//               placeholder="Experience"
//               value={formData.experience}
//               onChange={(e) => {
//                 const updatedFields = [...formFields];
//                 updatedFields[index].experience = e.target.value;
//                 setFormFields(updatedFields);
//               }}
//               fullWidth
//             />
//           </Grid>
//           <Grid item xs={1}>
//             <Button
//               onClick={addField}
//               variant="contained"
//               color="primary"
//               startIcon={<AddIcon />}
//             />
//           </Grid>
//           <Grid item xs={1}>
//             <Button
//               onClick={() => removeField(index)}
//               variant="contained"
//               color="secondary"
//               startIcon={<RemoveIcon />}
//             />
//           </Grid>
//         </Grid>
//       ))}
//     </div>
//   );
// };

// function App() {
//   return (
//     <div className="App">
//       <DynamicForm initialFormData={[{ name: "", experience: "" }]} />
//     </div>
//   );
// }

// export default App;

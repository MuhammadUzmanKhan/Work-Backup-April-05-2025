import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCp21kkhsnntdwpI27xEdCcjwGCEgYWh8w",
  authDomain: "coram-clone.firebaseapp.com",
  projectId: "coram-clone",
  storageBucket: "coram-clone.appspot.com",
  messagingSenderId: "194946468713",
  appId: "1:194946468713:web:7b5e13197fda44229f0bf8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

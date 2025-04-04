import { AdminLogin, AdminLoginResponse, MedicineProps, UserData } from "@/types";
import axios from "axios";
import { ID_TOKEN_KEY } from "./constants";

axios.defaults.baseURL = process.env.NEXT_PUBLIC_BASE_URL;
axios.
    interceptors.
    response
    .use(
        response => response,
        error => {
            if (error.status === 401 && !window.location.href.includes("login")) {
                !window.location.href.includes("unauthorized") ? window.location.href = "/unauthorized" : "";
            }
            throw error;
        }
    );
axios
    .interceptors
    .request
    .use(function (config) {
        if (localStorage.getItem(ID_TOKEN_KEY)) {
            !config.headers.Authorization ? config.headers.Authorization = "Bearer " + localStorage.getItem(ID_TOKEN_KEY) : undefined;
        }

        return config;
    });

export const apis = {
    getUser: () => axios.get<UserData>(`/users`),
    superAdminLogin: (data: AdminLogin) => axios.post<AdminLoginResponse>('/auth/super-admin-login', data),
    getMedicines: () => axios.get<MedicineProps[]>('/medicines')
};
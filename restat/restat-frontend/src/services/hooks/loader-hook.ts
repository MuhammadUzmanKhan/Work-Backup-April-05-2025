import { useState } from "react";

type invokeParams = {
  api: any,
  callBack: (data: Record<string, any>[]) => typeof data[],
  errorCallback: (e: any) => typeof e,
}

export const useLoader = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  const on = () => setLoading(true);
  const off = () => setLoading(false);

  const invokeApi = async ({ api, callBack, errorCallback }: invokeParams) => {
    try {
      on();
      // api has to be a fucntion returning axios promise i.e () => axios.get("http://example.com")
      const { data } = await api();
      if (process.env.VITE_APP_MODE === "local") console.info(data);
      callBack(data);
    } catch (e) {
      if (process.env.VITE_APP_MODE === "local") console.info(e);
      errorCallback && errorCallback(e);
    } finally {
      off();
    }
  }

  return {
    loading,
    on,
    off,
    invokeApi
  }
}
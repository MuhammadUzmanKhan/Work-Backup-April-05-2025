import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface HeaderState {
  title: string;
  actionButtons?: React.ReactNode[] | null;
  tabs?: React.ReactNode | null;
  date?: {
    range?: React.ReactNode | null;
    status?: React.ReactNode | null;
  } | null;
  select?: React.ReactNode | null;
  search?: React.ReactNode | null;
  filters?: React.ReactNode | null;
  progress?: React.ReactNode | null;
}

const initialState: HeaderState = {
  title: "",
  actionButtons: null,
  tabs: null,
  date: {
    range: null,
    status: null,
  },
  select: null,
  search: null,
  filters: null,
  progress: null,
};

const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    setHeaderData(_, action: PayloadAction<HeaderState>) {
      return { ...action.payload };
    },
  },
});

export const { setHeaderData } = headerSlice.actions;

export default headerSlice.reducer;

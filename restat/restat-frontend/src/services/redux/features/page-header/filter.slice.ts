import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FiltersState {
  selectedUpworkProfiles: string[];
  selectedBusinessDevelopers: string[];
  selectedTypes: string[];
  selectedStatus: string[];
  clientBudgetMin?: number;
  clientBudgetMax?: number;
  proposedRate?: number;
  receivedRate?: number;
  leadStartDate?: string;
  leadEndDate?: string;
  proposalStartDate?: string;
  proposalEndDate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  location?: string[];
  skillset?: string[];
  search?: string;
}


const initialState: FiltersState = {
  selectedUpworkProfiles: [],
  selectedBusinessDevelopers: [],
  selectedTypes: [],
  selectedStatus: [],
  clientBudgetMin: undefined,
  clientBudgetMax: undefined,
  proposedRate: undefined,
  receivedRate: undefined,
  leadStartDate: undefined,
  leadEndDate: undefined,
  proposalStartDate: undefined,
  proposalEndDate: undefined,
  contractStartDate: undefined,
  contractEndDate: undefined,
  location: [],
  skillset: undefined,
  search: undefined
};


const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    // Update multiple filters at once
    setFilters(state, action: PayloadAction<Partial<FiltersState>>) {
      return { ...state, ...action.payload };
    },

    // Reset all filters to their initial state
    resetFilters() {
      return initialState;
    },

    // Remove a specific Upwork profile
    removeProfile(state, action: PayloadAction<string>) {
      state.selectedUpworkProfiles = state.selectedUpworkProfiles.filter(
        (id) => id !== action.payload
      );
    },

    // Remove a specific Business Developer
    removeBidder(state, action: PayloadAction<string>) {
      state.selectedBusinessDevelopers = state.selectedBusinessDevelopers.filter(
        (id) => id !== action.payload
      );
    },

    // Remove location
    removeLocation(state, action: PayloadAction<string>) {
      state.location = state.location?.filter((location) => location !== action.payload);
    },
    // Add minimum budget
    addMinBudget(state, action: PayloadAction<number>) {
      state.clientBudgetMin = action.payload;
    },

    // Remove minimum budget
    removeMinBudget(state) {
      state.clientBudgetMin = undefined;
    },

    addMaxBudget(state, action: PayloadAction<number>) {
      state.clientBudgetMax = action.payload;
    },

    // Remove minimum budget
    removeMaxBudget(state) {
      state.clientBudgetMax = undefined;
    },
    addProposedRate(state, action: PayloadAction<number>) {
      state.proposedRate = action.payload;
    },

    // Remove proposed rate
    removeProposedRate(state) {
      state.proposedRate = undefined;
    },

    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },

    removeType(state, action: PayloadAction<string>) {
      state.selectedTypes = state.selectedTypes.filter((type) => type !== action.payload);
    },

    removeStatus(state, action: PayloadAction<string>) {
      state.selectedStatus = state.selectedStatus.filter((status) => status !== action.payload);
    },


    // Remove search term
    removeSearch(state) {
      state.search = undefined;
    },

    addRecievedRate(state, action: PayloadAction<number>) {
      state.receivedRate = action.payload;
    },

    // Remove proposed rate
    removeReceivedRate(state) {
      state.receivedRate = undefined;
    },

    // Set budget range
    setBudgetRange(
      state,
      action: PayloadAction<{ min?: number; max?: number }>
    ) {
      const { min, max } = action.payload;
      state.clientBudgetMin = min !== undefined ? (min === 0 ? 1 : min) : state.clientBudgetMin;
      state.clientBudgetMax = max !== undefined ? max : state.clientBudgetMax;
    },

    // Set rate ranges (proposed and received)
    setRates(
      state,
      action: PayloadAction<{ proposed?: number; received?: number }>
    ) {
      const { proposed, received } = action.payload;
      state.proposedRate = proposed !== undefined ? proposed : state.proposedRate;
      state.receivedRate = received !== undefined ? received : state.receivedRate;
    },

    // Set date ranges for various filters
    setDateRanges(
      state,
      action: PayloadAction<{
        leadStartDate?: string;
        leadEndDate?: string;
        proposalStartDate?: string;
        proposalEndDate?: string;
        contractStartDate?: string;
        contractEndDate?: string;
      }>
    ) {
      const {
        leadStartDate,
        leadEndDate,
        proposalStartDate,
        proposalEndDate,
        contractStartDate,
        contractEndDate,
      } = action.payload;

      state.leadStartDate = leadStartDate ?? state.leadStartDate;
      state.leadEndDate = leadEndDate ?? state.leadEndDate;
      state.proposalStartDate = proposalStartDate ?? state.proposalStartDate;
      state.proposalEndDate = proposalEndDate ?? state.proposalEndDate;
      state.contractStartDate = contractStartDate ?? state.contractStartDate;
      state.contractEndDate = contractEndDate ?? state.contractEndDate;
    },
    // Set location
    setLocation(state, action: PayloadAction<string | undefined>) {
      state.location = action.payload ? [action.payload] : undefined;
    },

    removeDates(state, action: PayloadAction<string>) {
      if (action.payload === 'lead') {
        state.leadStartDate = undefined;
        state.leadEndDate = undefined;
      } else if (action.payload === 'proposal') {
        state.proposalStartDate = undefined;
        state.proposalEndDate = undefined;
      } else if (action.payload === 'contract') {
        state.contractStartDate = undefined;
        state.contractEndDate = undefined;
      }
    },

    removeSkill(state, action: PayloadAction<string>) {
      if (state.skillset) {
        state.skillset = state.skillset.filter((skill) => skill !== action.payload);
      }
    },
  },
});

export const {
  setFilters,
  resetFilters,
  removeProfile,
  removeBidder,
  setBudgetRange,
  setRates,
  setDateRanges,
  setLocation,
  removeSkill,
  removeLocation,
  addMinBudget,
  removeMinBudget,
  addMaxBudget,
  removeMaxBudget,
  addRecievedRate,
  removeReceivedRate,
  addProposedRate, removeProposedRate,
  removeSearch,
  setSearch,
  removeType,
  removeStatus,
  removeDates,
} = filtersSlice.actions;

export default filtersSlice.reducer;


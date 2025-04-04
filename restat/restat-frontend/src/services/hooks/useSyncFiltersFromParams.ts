import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setFilters } from "../redux/features/page-header/filter.slice";

const useSyncFiltersFromParams = (searchParams: URLSearchParams) => {
  const dispatch = useDispatch();

  // Access the existing Redux state
  const filters = useSelector((state: RootState) => state.filters);

  useEffect(() => {
    const parseDate = (dateString: string | null): string | undefined => {
      return dateString ? new Date(dateString).toISOString() : undefined;
    };

    const newFilters: Partial<any> = {};

    // Compare and add parameters only if they are missing in Redux state
    if (!filters.search && searchParams.get("search")) {
      newFilters.search = searchParams.get("search")!;
    }

    if (filters.selectedTypes.length === 0 && searchParams.get("type")) {
      newFilters.selectedTypes = [searchParams.get("type")!];
    }

    if (filters.selectedUpworkProfiles.length === 0 && searchParams.get("upwork_profiles")) {
      newFilters.selectedUpworkProfiles = searchParams.get("upwork_profiles")!.split(",");
    }

    if (filters.selectedBusinessDevelopers.length === 0 && searchParams.get("business_developer")) {
      newFilters.selectedBusinessDevelopers = searchParams.get("business_developer")!.split(",");
    }

    if (!filters.selectedStatus.length && searchParams.get("status")) {
      newFilters.selectedStatus = searchParams.get("status")!.split(",");
    }

    if (!filters.skillset && searchParams.get("skillset")) {
      newFilters.skillset = searchParams.get("skillset")!.split(",");
    }

    if (!filters.clientBudgetMin && searchParams.get("client_budget_min")) {
      newFilters.clientBudgetMin = +searchParams.get("client_budget_min")!;
    }

    if (!filters.clientBudgetMax && searchParams.get("client_budget_max")) {
      newFilters.clientBudgetMax = +searchParams.get("client_budget_max")!;
    }

    if (!filters.proposedRate && searchParams.get("proposed_rate")) {
      newFilters.proposedRate = +searchParams.get("proposed_rate")!;
    }

    if (!filters.receivedRate && searchParams.get("received_rate")) {
      newFilters.receivedRate = +searchParams.get("received_rate")!;
    }

    if (filters.location?.length === 0 && searchParams.get("location")) {
      newFilters.location = searchParams.get("location")!.split(",");
    }

    if (!filters.leadStartDate && searchParams.get("lead_start_date")) {
      newFilters.leadStartDate = parseDate(searchParams.get("lead_start_date"));
    }

    if (!filters.leadEndDate && searchParams.get("lead_end_date")) {
      newFilters.leadEndDate = parseDate(searchParams.get("lead_end_date"));
    }

    if (!filters.proposalStartDate && searchParams.get("proposal_start_date")) {
      newFilters.proposalStartDate = parseDate(searchParams.get("proposal_start_date"));
    }

    if (!filters.proposalEndDate && searchParams.get("proposal_end_date")) {
      newFilters.proposalEndDate = parseDate(searchParams.get("proposal_end_date"));
    }

    if (!filters.contractStartDate && searchParams.get("contract_start_date")) {
      newFilters.contractStartDate = parseDate(searchParams.get("contract_start_date"));
    }

    if (!filters.contractEndDate && searchParams.get("contract_end_date")) {
      newFilters.contractEndDate = parseDate(searchParams.get("contract_end_date"));
    }

    if (Object.keys(newFilters).length > 0) {
      dispatch(setFilters(newFilters));
    }
  }, [searchParams, dispatch]);

}

export default useSyncFiltersFromParams;


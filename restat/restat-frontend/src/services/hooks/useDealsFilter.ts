import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apis } from '../apis';
import { customNotification } from '../../components';

export const useDealsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams.entries());
      const { data } = await apis.getBiddersBidOrAdminBids(params);
      setDeals(data.data);
      setPagination({
        current: Number(params.page) || 1,
        pageSize: Number(params.per_page) || 20,
        total: data.dataCount,
      });
    } catch (err: any) {
      customNotification.error(
        "Error!",
        err?.response?.data?.message ||
        "An error occurred in getting the deals! Please try again later"
      );
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          updatedParams.set(key, value);
        } else {
          updatedParams.delete(key);
        }
      });
      return updatedParams;
    });
  }, [setSearchParams]);

  return { deals, loading, pagination, updateFilters };
};


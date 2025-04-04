import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout";
import { IModal, apis, routes, } from "../../services";
import {
  UsersObject,
} from "../../services/types/common";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import { Cascader, Space, Input, Pagination, Table, PaginationProps, CascaderProps, } from "antd";
import { customNotification } from "../../components";
import { setCompanies, setCompaniesCount, setCompaniesPerPage } from "../../services/redux/features/companies/companies-slice";
import { getCompaniesTableHeadings } from "../../services/constants/companies";
import { debounce } from "../../services/utils/debounce";
import CompaniesDetailsModal from "../../components/modals/companies-modal";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";



const Companies = React.memo(({ user }: { user: UsersObject }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [companySize, setCompanySize] = useState<string[]>([]);

  const dispatch = useDispatch();

  const navigate = useNavigate()
  const { companySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams();

  const { Search } = Input;

  const companies = useSelector((state: RootState) => state.companies.companies);
  const companiesCount = useSelector(
    (state: RootState) => state.companies.companiesCount
  );
  const companiesPerPage = useSelector(
    (state: RootState) => state.companies.companiesPerPage
  );

  const [detailModal, setDetailModal] = useState<IModal>({ show: false, id: '' });

  const cascaderFilterArray = ['companySize'];
  const options = [
    {
      value: 'companySize',
      label: 'Company Size',
      children: [
        {
          value: '1-10',
          label: '1-10',
        },
        {
          value: '11-50',
          label: '11-50',
        },
        {
          value: '51-100',
          label: '51-100',
        },
        {
          value: '101-500',
          label: '101-500',
        },
        {
          value: '501-1000',
          label: '501-1000',
        },
        {
          value: '1000+',
          label: '1000+',
        },
      ],
    }
  ];

  const updateUrlParams = (params: { [key: string]: string; }) => {
    setSearchParams((prevParams) => {
      const newParams = { ...Object.fromEntries(prevParams.entries()), ...params };

      Object.keys(newParams).forEach((key) => {
        if (!newParams[key] ||
          (key === "page" && newParams[key] === "1") ||
          (key === "per_page" && newParams[key] === "20")
        ) {
          delete newParams[key];
        }
      })

      return new URLSearchParams(newParams);
    });
  };

  const handleViewDetailsIcon = (slug: string) => {
    navigate(`${routes.companies}/${slug}`)
    setDetailModal({ show: true, id: slug });
  }

  const fetchData = async (
    {
      search,
      companySize,
      page,
      perPage
    }: {
      search: string,
      companySize: string[],
      page: number,
      perPage: number
    }
  ) => {
    try {
      setLoading(true);
      const { data } = await apis.getAllCompanies(
        {
          search,
          companySize: companySize.join(),
          page,
          perPage
        }
      );

      setPage(data?.page);
      dispatch(setCompanies(data?.companies));
      dispatch(setCompaniesCount(data?.companiesCount));
      dispatch(setCompaniesPerPage(data?.companiesPerPage));
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      customNotification.error(err?.response?.data?.message || 'An error occured in fetching accounts! Please try again later')
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(() => {
    return debounce(
      (
        query: string,
        companySize: string[],
        page: number,
        perPage: number
      ) => {
        fetchData({ search: query, companySize, page, perPage });
      },
      300
    );
  }
    , []);

  const onPaginationChange: PaginationProps['onChange'] = (pageNumber) => {
    setPage(pageNumber)
    pageNumber === 1 && updateUrlParams({ page: "" });
  };

  const onPerPageChange: PaginationProps['onShowSizeChange'] = (_, pageSize) => {
    dispatch(setCompaniesPerPage(pageSize));
    updateUrlParams({ per_page: pageSize.toString() });
  }

  const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();

    if (query.length >= 3) {
      updateUrlParams({ search: query });
    } else {
      setSearchParams((prevParams) => {
        const params = Object.fromEntries(prevParams.entries());
        delete params.search;
        return { ...params };
      });
    }

    setSearch(query);
  };

  const onChangeCascader: CascaderProps<any>['onChange'] = (value) => {

    if (!value.length) {
      setCompanySize([]);

      setSearchParams((prevParams) => {
        const params = Object.fromEntries(prevParams.entries());
        delete params.companySize;
        return { ...params };
      });
      return
    }

    const grouped = value.reduce((acc, row, i) => {
      if (i === 0) {
        acc['companySize'] = []
      }

      if (row[0] === 'companySize') {
        acc['companySize'].push(row[1])
      }

      return acc
    }, {})

    if (page > 1) {
      setPage(1);
    }

    if (grouped?.companySize) setCompanySize(grouped?.companySize as string[]);

    updateUrlParams({ companySize: grouped?.companySize.join() });
  };

  useEffect(() => {
    const querySearch = searchParams.get('search') || '';
    const queryCompanySize = searchParams.get('companySize')?.split(',') || [];
    const queryPage = searchParams.get("page");
    const queryPerPage = searchParams.get("per_page");

    if (querySearch.length >= 3) setSearch(querySearch);
    if (queryCompanySize.length) setCompanySize(queryCompanySize);
    if (queryPage) setPage(parseInt(queryPage));
    if (queryPerPage) dispatch(setCompaniesPerPage(parseInt(queryPerPage)));

    if (
      querySearch.length >= 3 ||
      queryCompanySize.length ||
      queryPage ||
      queryPerPage
    ) {
      fetchData({
        search: querySearch,
        companySize: queryCompanySize,
        page: queryPage ? parseInt(queryPage) : 1,
        perPage: queryPerPage ? parseInt(queryPerPage) : companiesPerPage
      });
    } else {
      fetchData({ search, companySize, page, perPage: companiesPerPage });
    }
  }, [searchParams])

  useEffect(() => {
    if (companiesPerPage !== 20) {
      updateUrlParams({ per_page: companiesPerPage.toString() });
    }
    if (page !== 1) {
      updateUrlParams({ page: page.toString() });
    }
  }, [companiesPerPage, page]);

  useEffect(() => {
    if (search.length >= 3) {
      debouncedSearch(search, companySize, page, companiesPerPage);
    }
  }, [search, page, companiesPerPage, companySize]);

  useEffect(() => {
    if (search.length > 0 && search.length < 3) {
      fetchData({ search, companySize: [], page, perPage: companiesPerPage });
    }
  }, [search, page, companiesPerPage]);

  useEffect(() => {
    if (companySlug) {
      handleViewDetailsIcon(companySlug);
    }
  }, [companySlug]);

  useEffect(() => {
    dispatch(setHeaderData({
      title: "Companies",
      search: <Search size="middle" placeholder="Search anything" onChange={onChangeSearch} loading={loading} value={search} />,
      select: <Cascader
        allowClear
        options={options}
        expandTrigger="hover"
        dropdownStyle={{ maxHeight: 450, overflow: 'auto' }}
        style={{ minWidth: '320px' }}
        placeholder="Please select"
        placement="bottomLeft"
        onChange={onChangeCascader}
        defaultValue={
          Object.keys(Object.fromEntries(searchParams.entries())).map(key => {
            if (cascaderFilterArray.includes(key)) {
              return [key, Object.fromEntries(searchParams.entries())[key]]
            } else {
              return []
            }
          })
        }
        multiple
        maxTagCount="responsive"
      />
    }));
  }, [companies, search, companySize, loading]);

  return (
    <>
      <Layout>
        <div className="flex justify-between items-center flex-col gap-3">
          <Table
            className="custom-table"
            columns={getCompaniesTableHeadings(handleViewDetailsIcon)}
            key={companies.length}
            dataSource={companies ?? []}
            pagination={false}
            scroll={{ x: 1500, y: 'calc(100vh - 16.3rem)' }}
            size="large"
            loading={loading}
          />
          {companiesCount ? <Space direction="horizontal" size={12} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              showQuickJumper
              total={companiesCount}
              defaultCurrent={page}
              current={page}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              onChange={onPaginationChange}
              defaultPageSize={companiesPerPage}
              pageSize={companiesPerPage}
              onShowSizeChange={onPerPageChange}
            />
          </Space> : null}
        </div>
      </Layout>
      {
        detailModal.show && (
          <CompaniesDetailsModal modal={detailModal} handleCloseModal={() => {
            navigate(routes.companies)
            setDetailModal({ show: false, id: '' })
          }} />
        )
      }
    </>
  );
});

export default Companies;

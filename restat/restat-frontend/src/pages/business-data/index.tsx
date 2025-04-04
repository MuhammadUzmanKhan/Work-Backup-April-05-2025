
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout";
import { apis } from "../../services";
import { useDispatch, useSelector } from "react-redux";
import {
  setIndustries,
  setIndustriesCount,
  setIndustriesPerPage
} from "../../services/redux/features/industries/industries.slice";
import { RootState } from "../../services/redux/store";
import { ActionButton, customNotification } from '../../components';
import { Pagination, PaginationProps, Space, Table, Input } from "antd";
import { getIndustriesTableHeadings } from "../../services/constants/industries";
import IndustriesModal from "../../components/modals/industies.modal";
import { BankOutlined } from '@ant-design/icons';
import DeleteModal from "../../components/delete-modal";
import { debounce } from "../../services/utils/debounce";
import { useSearchParams } from "react-router-dom";
import cleanAndTrimWhitespace from "../../services/utils/trimSpaces";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";

const Industries = React.memo(() => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [industryModal, setIndustryModal] = useState<{ show: boolean, showDeleteModal: boolean, data: any }>({
    show: false,
    showDeleteModal: false,
    data: null
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const industries = useSelector((state: RootState) => state.industies.industries);
  const industriesCount = useSelector((state: RootState) => state.industies.industriesCount);
  const industriesPerPage = useSelector((state: RootState) => state.industies.industriesPerPage);

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

  const fetchData = async ({
    page, search, industriesPerPage
  }: {
    page: number,
    search: string,
    industriesPerPage: number
  }) => {
    try {
      setLoading(true);
      const { data } = await apis.getLinkedinIndustriesWithPagination({ page, perPage: industriesPerPage, search });
      setPage(data?.page);
      dispatch(setIndustries(data?.industries));
      dispatch(setIndustriesCount(data?.industriesCount));
      dispatch(setIndustriesPerPage(data?.perPage));
    } catch (error: any) {
      console.error(error);
      customNotification.error(error?.response?.data?.message || 'An Error Occurred!');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(() => {
    return debounce((search: string, page: number) => {
      fetchData({ page, search, industriesPerPage });
    }, 500);
  }, []);

  const onPaginationChange: PaginationProps['onChange'] = (pageNumber) => {
    setPage(pageNumber);
    pageNumber === 1 && updateUrlParams({ page: "" });
  };

  const onPerPageChange: PaginationProps['onShowSizeChange'] = (_, pageSize) => {
    dispatch(setIndustriesPerPage(pageSize));
    updateUrlParams({ per_page: pageSize.toString() });
  };

  const handleEditIndustry = (data: any) => setIndustryModal({ show: true, showDeleteModal: false, data });

  const handleDeleteIndustry = (data: any) => { setIndustryModal({ show: false, showDeleteModal: true, data }) };

  const onChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = cleanAndTrimWhitespace(e.target.value.trim());

    if (query.length >= 2) {
      setSearchParams({ search: query });
    } else {
      setSearchParams((prevParams) => {
        const params = Object.fromEntries(prevParams.entries());
        delete params.search;
        return { ...params };
      });
    }

    setSearch(query);
    if (page > 1) {
      setPage(1);
    }
  };

  useEffect(() => {
    const querySearch = searchParams.get('search') || '';
    const queryPage = searchParams.get("page");
    const queryPerPage = searchParams.get("per_page");

    if (querySearch.length >= 2 ||
      queryPage ||
      queryPerPage
    ) {
      setSearch(querySearch);
      setPage(Number(queryPage) || 1);
      dispatch(setIndustriesPerPage(Number(queryPerPage) || 20));

      fetchData({ page: Number(queryPage) || 1, search: querySearch, industriesPerPage: Number(queryPerPage) || 20 });
    } else {
      fetchData({ page, search: '', industriesPerPage });
    }

  }, [searchParams]);

  useEffect(() => {
    if (industriesPerPage !== 20) {
      updateUrlParams({ per_page: industriesPerPage.toString() });
    }
    if (page !== 1) {
      updateUrlParams({ page: page.toString() });
    }
  }, [industriesPerPage, page]);

  useEffect(() => {
    if (search.length >= 2) {
      debouncedSearch(search, page);
    }
  }, [industriesPerPage, page, search]);

  useEffect(() => {
    dispatch(setHeaderData({
      title: "Business Data",
      actionButtons: [
        <ActionButton
          text="Add"
          tooltip="Add Industry"
          onClick={() => setIndustryModal({ show: true, showDeleteModal: false, data: null })}
          icon={<BankOutlined />}
        />
      ],
      search: <Input.Search
        placeholder="Search by name or description"
        value={search}
        onChange={onChangeSearch}
        style={{ width: 300, marginBottom: 16 }}
        loading={loading}
      />,
    }));
  }, [search, loading]);

  return (
    <Layout>
      <div className="flex justify-between items-center flex-col gap-3">
        <Table
          className="custom-table"
          dataSource={industries || []}
          columns={getIndustriesTableHeadings({ handleEditIndustry, handleDeleteIndustry })}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1500, y: 'calc(100vh - 16.3rem)' }}
          size="large"
          loading={loading}
        />
        {industriesCount ? <Space direction="horizontal" size={12} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            showQuickJumper
            total={industriesCount}
            defaultCurrent={page}
            current={page}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            onChange={onPaginationChange}
            defaultPageSize={industriesPerPage}
            pageSize={industriesPerPage}
            onShowSizeChange={onPerPageChange}
          />
        </Space> : null}
      </div>
      {industryModal.show &&
        <IndustriesModal
          showModal={industryModal.show}
          closeModal={() => setIndustryModal({ show: false, showDeleteModal: false, data: null })}
          data={industryModal.data}
          fetchData={() => fetchData({ page, search, industriesPerPage })}
        />
      }
      {
        industryModal.showDeleteModal && (
          <DeleteModal
            showDeleteModal={industryModal.showDeleteModal}
            heading="Industry"
            title="Industry"
            industryId={industryModal.data.id}
            closeDeleteModal={() => setIndustryModal({ ...industryModal, showDeleteModal: false })}
            fetchUsers={() => fetchData({ page, search, industriesPerPage })}
          />
        )
      }
    </Layout>
  );
});

export default Industries;

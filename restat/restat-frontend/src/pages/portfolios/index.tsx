import Layout from "../../components/layout";
import { PORTFOLIO_TYPE } from "../../services/types/portfolio_types";
import CreatePortfolio from "../../components/portfolios";
import { images } from "../../assets";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Input, Select, Pagination, Space, PaginationProps } from "antd";
import { debounce } from "../../services/utils/debounce";
import { RootState } from "../../services/redux/store";
import { apis } from "../../services";
import { setPortfolios, setPortfoliosCount, setPortfoliosPerPage } from "../../services/redux/features/portfolios/portfolios.slice";
import { useSearchParams } from "react-router-dom";
import { getPortfolioTableHeadings } from "../../services/constants/portfolios";
import DeleteModal from "../../components/delete-modal";
import Portfolio from "../../components/portfolios/portfolio";
import { formatTitle } from "../../services/utils/formateTitle";
import { Tags } from "../../services/types/common";
import { customNotification } from '../../components';
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";

const Portfolios = () => {
  const dispatch = useDispatch();

  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [tagsSearchResult, setTagsSearchResult] = useState<Tags[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [portfolioHandler, setPortfolioHandler] = useState<{
    showModal: boolean,
    showDeleteModal: boolean,
    portfolio: any
  }>({
    showModal: false,
    showDeleteModal: false,
    portfolio: {}
  });

  const portfoliosData = useSelector(
    (state: RootState) => state.portfolios.portfolios
  );

  const portfoliosPerPage = useSelector(
    (state: RootState) => state.portfolios.portfoliosPerPage
  );
  const portfoliosCount = useSelector(
    (state: RootState) => state.portfolios.portfoliosCount
  );

  const [searchParams, setSearchParams] = useSearchParams();

  const updateUrlParams = (params: { [key: string]: string; }) => {
    setSearchParams((prevParams) => {
      const newParams = { ...Object.fromEntries(prevParams.entries()), ...params };

      Object.keys(newParams).forEach((key) => {
        if (!newParams[key] ||
          (key === "page" && newParams[key] === "1") ||
          (key === "per_page" && newParams[key] === "20")) {
          delete newParams[key];
        }
      })

      return new URLSearchParams(newParams);
    });
  };

  const debouncedSearch = useMemo(() => {
    return debounce((type: string, query: string, page: number, perPage: number, sort: string, tags: string[]) => {
      if (query.length >= 3) {
        fetchData(type, query, page, perPage, sort, tags);
      }
    }, 320);
  }, []);

  const onChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
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
    if (page > 1) {
      setPage(1);
    }
  };

  const fetchData = async (type: string, search: string, page: number, perPage: number, sort: string, tags: string[]) => {
    try {
      setLoading(true);
      const tagString: string = tags.length > 0 ? tags.join(",") : "";
      const { data: portfolios } = await apis.getAllPortfolios(
        type,
        search,
        page,
        perPage,
        sort,
        tagString,
      );
      setPage(portfolios?.page);
      dispatch(setPortfolios(portfolios?.portfolios));
      dispatch(setPortfoliosCount(portfolios?.portfoliosCount));
      dispatch(setPortfoliosPerPage(portfolios?.portfoliosPerPage));
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An error occurred in fetching Portfolio')
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async (query: string) => {
    try {
      const response = await apis.getAllTags(query);
      if (response) {
        const tags = await response.data?.tags;
        setTagsSearchResult(tags);
      } else {
        throw new Error("Failed to fetch tags");
      }
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An error occurred in fetching Tags')
    }
  };

  const handleOptionChange = (option: string) => {
    const selectedType = option === "All" ? "" : option;
    setType(selectedType);
    updateUrlParams({ type: selectedType });
    if (page > 1) {
      setPage(1);
    }
  };

  const handleSortChange = (option: string) => {
    setSort(option);
    updateUrlParams({ sort: option });
  };

  const onPaginationChange = (pageNumber: number) => {
    setPage(pageNumber);
    pageNumber === 1 && updateUrlParams({ page: "" });
  };

  const onPerPageChange: PaginationProps['onShowSizeChange'] = (_, pageSize) => {
    dispatch(setPortfoliosPerPage(pageSize));
    updateUrlParams({ per_page: pageSize.toString() });
  };

  const handleViewIconClick = (portfolio: any) => {
    setPortfolioHandler({ showModal: true, showDeleteModal: false, portfolio });
  };

  const handleDeleteIconClick = (portfolio: any) => {
    setPortfolioHandler({ showModal: false, showDeleteModal: true, portfolio });
  };

  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags);
    updateUrlParams({ tags: tags.join() });
    if (page > 1) {
      setPage(1);
    }
  };

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    const queryTags = searchParams.getAll("tags") || [];
    const querySort = searchParams.get("sort") || "";
    const queryType = searchParams.get("type") || "";
    const queryPage = searchParams.get("page");
    const queryPerPage = searchParams.get("per_page");

    if (querySearch.length >= 3) setSearch(querySearch);
    if (queryType) setType(queryType);
    if (querySort) setSort(querySort);
    if (queryTags.length > 0) setSelectedTags(queryTags);
    if (queryPage) setPage(parseInt(queryPage));
    if (queryPerPage) dispatch(setPortfoliosPerPage(parseInt(queryPerPage)));

    if (
      querySearch.length >= 3 ||
      queryType ||
      querySort ||
      queryTags?.length ||
      queryPage ||
      queryPerPage
    ) {
      fetchData(
        queryType,
        querySearch,
        queryPage ? parseInt(queryPage) : 1,
        queryPerPage ? parseInt(queryPerPage) : portfoliosPerPage,
        querySort,
        queryTags);
    } else {
      fetchData(type, search, page, portfoliosPerPage, sort, selectedTags);
    }

  }, [searchParams]);

  useEffect(() => {
    if (portfoliosPerPage !== 20) {
      updateUrlParams({ per_page: portfoliosPerPage.toString() });
    }
    if (page !== 1) {
      updateUrlParams({ page: page.toString() });
    }
  }, [portfoliosPerPage, page]);

  useEffect(() => {
    if (search.length >= 3) {
      debouncedSearch(type, search, page, portfoliosPerPage, sort, selectedTags);
    }
  }, [type, search, page, portfoliosPerPage, sort, selectedTags]);

  useEffect(() => {
    if (search.length > 0 && search.length < 3) {
      fetchData(type, "", page, portfoliosPerPage, sort, selectedTags);
    }
  }, [type, page, sort, selectedTags]);

  useEffect(() => {
    fetchTags(search);
  }, [search]);

  const sortOptions = [
    { label: 'Title', value: 'title' },
    { label: 'Type', value: 'type' },
    { label: 'Updated Date', value: 'updatedAt' },
  ];

  const options = useMemo(() => [
    { label: 'All', value: 'All' },
    { label: 'Project', value: PORTFOLIO_TYPE.PROJECT },
    { label: 'Case Study', value: PORTFOLIO_TYPE.CASE_STUDY },
    { label: 'Link', value: PORTFOLIO_TYPE.LINK },
    { label: 'Template', value: PORTFOLIO_TYPE.TEMPLATE },
  ], []);

  useEffect(() => {
    dispatch(setHeaderData({
      title: "Portfolios",
      actionButtons: [
        <CreatePortfolio
          bg={"#1A4895"}
          tooltipText="Create Project"
          icon={images.project}
          title={"Project"}
          showLinks={true}
          type={PORTFOLIO_TYPE.PROJECT}
        />,

        <CreatePortfolio
          bg={"#1A4895"}
          tooltipText="Create Case Study"
          icon={images.case_study}
          title={"Case Study"}
          showLinks={true}
          type={PORTFOLIO_TYPE.CASE_STUDY}
        />,
        <CreatePortfolio
          bg={"#1A4895"}
          icon={images.add_team_members}
          tooltipText="Create Link"
          title={"Link"}
          showLinks={true}
          type={PORTFOLIO_TYPE.LINK}
        />,
        <CreatePortfolio
          bg={"#1A4895"}
          icon={images.template}
          tooltipText="Create Template"
          title={"Template"}
          showLinks={false}
          type={PORTFOLIO_TYPE.TEMPLATE}
        />,
        <CreatePortfolio
          bg={"#1A4895"}
          icon={images.upload}
          tooltipText="Import Portfolios"
          title={"import"}
          showLinks={false}
          type={PORTFOLIO_TYPE.IMPORT}
        />
      ],
      search: <Input.Search
        size="middle"
        placeholder="Search anything"
        onChange={onChangeSearch}
        loading={loading}
        value={search}
      />,
      select: <div className="flex justify-center items-center gap-2">
        <Select
          mode="multiple"
          showSearch
          style={{ minWidth: '150px', maxWidth: '400px' }}
          placeholder="Select Tags"
          optionFilterProp="label"
          value={selectedTags}
          onChange={handleTagChange}
          options={tagsSearchResult.map(tag => ({ label: tag.name, value: tag.id }))}
          onSearch={fetchTags}
          loading={loading}
          maxTagCount={3}
          maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
        />
        <Select
          showSearch
          style={{ minWidth: '150px' }}
          placeholder="Select Sort"
          optionFilterProp="label"
          value={sort === '' ? 'updatedAt' : sort}
          onChange={handleSortChange}
          options={sortOptions}
          loading={loading}
        />
        <Select
          showSearch
          style={{ minWidth: '150px' }}
          placeholder="Select Category"
          optionFilterProp="label"
          value={type === "" ? "All" : type}
          onChange={handleOptionChange}
          options={options}
          loading={loading}
        />
      </div>
    }));
  }, [tagsSearchResult, selectedTags, sort, type, search, loading]);
  return (
    <Layout>
      <div className="flex justify-between items-center flex-col gap-3">
        <Table
          className="custom-table"
          columns={getPortfolioTableHeadings({
            handlePortfolioViewIcon: handleViewIconClick,
            handlePortfolioDeleteIcon: handleDeleteIconClick
          })}
          dataSource={portfoliosData}
          pagination={false}
          scroll={{ x: 1500, y: 'calc(100vh - 16.3rem)' }}
          size="large"
          loading={loading}
        />
        {portfoliosCount ? (
          <Space direction="horizontal" size={12} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              showQuickJumper
              total={portfoliosCount}
              current={page}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              onChange={onPaginationChange}
              pageSize={portfoliosPerPage}
              onShowSizeChange={onPerPageChange}
            />
          </Space>
        ) : null}
      </div>
      {portfolioHandler.showModal && (
        <Portfolio
          showLinks={!!portfolioHandler.portfolio?.type}
          type={portfolioHandler.portfolio.type}
          title={formatTitle(portfolioHandler.portfolio.type)}
          portfolio={portfolioHandler.portfolio}
          showModal={portfolioHandler.showModal}
          openModal={() => setPortfolioHandler({ ...portfolioHandler, showModal: true })}
          closeModal={() => setPortfolioHandler({ ...portfolioHandler, showModal: false })}
          fetchData={() => fetchData("", "", 1, 20, "", [])}
        />
      )}

      {portfolioHandler.showDeleteModal && (
        <DeleteModal
          showDeleteModal={portfolioHandler.showDeleteModal}
          heading="Portfolio"
          title={formatTitle(portfolioHandler.portfolio.type)}
          portfolio={portfolioHandler.portfolio}
          closeDeleteModal={() => setPortfolioHandler({ ...portfolioHandler, showDeleteModal: false })}
          fetchUsers={() => fetchData("", "", 1, 20, "", [])}
        />
      )}
    </Layout>
  );
};

export default Portfolios;

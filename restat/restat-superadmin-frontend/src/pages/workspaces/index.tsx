import { useEffect, useState } from "react";
import { apis } from "../../services";
import { getWorkspaceColumns, Workspace } from "../../services/constants/workspaces";
import { Table, Pagination, Space, Input, DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Workspaces = () => {
    const [data, setData] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(20);
    const [total, setTotal] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [dateFilterType, setDateFilterType] = useState<string>("lastActivity");
    const [dateRange, setDateRange] = useState<[string, string] | null>(null);



    // Fetch Workspace Data
    const getAllWorkspaces = async () => {
        try {
            setLoading(true);
            const response = await apis.getAllWorkspaces({
                page,
                perPage,
                search: searchQuery,
                dateFilterType,
                startDate: dateRange ? dateRange[0] : undefined,
                endDate: dateRange ? dateRange[1] : undefined,
            });
            const { data, meta } = response.data;
            setData(data);
            setTotal(meta.total);
        } catch (error) {
            console.error("Error fetching workspaces:", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced Search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getAllWorkspaces();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [page, perPage, searchQuery, dateFilterType, dateRange]);

    // Handle page change
    const handlePageChange = (pageNumber: number) => {
        setPage(pageNumber);
    };

    // Handle items per page change
    const handlePerPageChange = (_: number, size: number) => {
        setPage(1);
        setPerPage(size);
    };

    // Search Handler
    const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value.trim());
        setPage(1); // Reset to first page on new search
    };

    // Date Range Handler
    // Date Range Handler
    const onDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates) {
            setDateRange([
                moment(dates[0]?.toISOString()).startOf('day').toISOString(),
                moment(dates[1]?.toISOString()).endOf('day').toISOString()
            ]);
            setPage(1);
        } else {
            setDateRange(null);
        }
    };


    // Dropdown Handler
    const onFilterTypeChange = (value: string) => {
        setDateFilterType(value);
        setDateRange(null);
        setPage(1);
    };

    return (
        <div className="inner-content flex-1 flex flex-col">
            <div className="flex-1 bottom-0 w-full flex flex-col pl-4 pr-8 pt-10">
                <Space className="flex justify-end pb-4 w-full">
                    <Input
                        placeholder="Search workspaces..."
                        allowClear
                        onChange={onChangeSearch}
                        style={{ width: "300px" }}
                    />
                    <Space>
                        <Select
                            value={dateFilterType}
                            onChange={onFilterTypeChange}
                            style={{ width: 200 }}
                        >
                            <Option value="lastActivity">Last Activity</Option>
                            <Option value="createdDate">Created Date</Option>
                        </Select>
                        <RangePicker
                            value={
                                dateRange
                                    ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                                    : null
                            }
                            onChange={onDateRangeChange}
                            format="MMM DD, YYYY"
                        />
                    </Space>
                </Space>
                <div style={{ height: "calc(100vh - 180px)", }}>
                    <Table
                        columns={getWorkspaceColumns}
                        dataSource={data}
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 1000, y: "calc(100vh - 16rem)" }}
                        size="large"
                    />
                </div>
                {total > 0 && (
                    <Pagination
                        current={page}
                        total={total}
                        defaultPageSize={perPage}
                        showSizeChanger
                        pageSizeOptions={['10', '20', '50', '100']}
                        onChange={handlePageChange}
                        onShowSizeChange={handlePerPageChange}
                        showTotal={(total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`
                        }
                        className="flex justify-center"
                        style={{ marginTop: "16px", textAlign: "right" }}
                    />
                )}
            </div>
        </div>
    );
};

export default Workspaces;
import { DatePicker, Drawer, Form, Input, Select, Space, Spin, Timeline, Typography } from "antd"
import { useEffect, useState } from "react";
import { DateProps } from "../../services/types/common";
import dayjs from "dayjs";
import moment from "moment";
import { apis, DEAL_LOG_TYPE, LeadLogType } from "../../services";
import { convertDateFormat } from "../../services/utils/convertDate";
import { customNotification } from "..";

interface DealLogData {
  date: string;
  time: string;
  user: { name: string, deletedAt: string };
  message: string;
  dealLogType: DEAL_LOG_TYPE;
  updatedAt: string;
}

const DealLogDrawer = ({ onClose, open, id }: { onClose: () => void, open: boolean, id: string }) => {

  const [logsData, setLogsData] = useState<DealLogData[]>([])
  const [filteredData, setFilteredData] = useState<DealLogData[]>([])

  const [date, setDate] = useState<DateProps>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    selected: true,
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeadsLog = async (bidId: string, accountId: string = "") => {
    try {
      setLoading(true)
      const response = await apis.getLogs(
        bidId,
        accountId
      )
      setLogsData(response?.data?.dealLogs)
      setFilteredData(response?.data?.dealLogs)
    }
    catch (error) {
      customNotification.error("Error!", 'Error fetching leads log')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let data = [...logsData];

    if (date.selected && date.startDate && date.endDate) {
      data = data.filter((item) => {
        const itemDate = moment(item.updatedAt);
        return itemDate.isBetween(
          moment(date.startDate).startOf('day'),
          moment(date.endDate).endOf('day'),
          null,
        );
      });
    }

    if (searchInput.trim()) {
      data = data.filter(
        (item) =>
          item.message.toLowerCase().includes(searchInput.toLowerCase()) ||
          item.user?.name?.toLowerCase().includes(searchInput.toLowerCase())
      );
    }

    if (selectedTypes.length > 0) {
      data = data.filter((item) => selectedTypes.includes(item.dealLogType));
    }

    setFilteredData(data);
  };

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setFilteredData(logsData);
      return;
    }
    applyFilters();
  };

  const handleDateRangeChange = async (_: any, dates: string[]) => {
    if (dates[0] === '') {
      setDate({
        startDate: null,
        endDate: null,
        selected: false
      })
    } else {
      setDate({
        startDate: moment(dates[0]).toDate(),
        endDate: moment(dates[1]).toDate(),
        selected: true
      })
    }
    applyFilters();
  };

  const handleChangeByType = (values: string[]) => {
    setSelectedTypes(values);
    applyFilters();
  };

  const handleSort = (value: string) => {
    if (value === "latest") {
      setFilteredData([...filteredData].sort((a, b) => moment(b.updatedAt).diff(moment(a.updatedAt)))
      )
      return
    }
    if (value === "oldest") {
      setFilteredData([...filteredData].sort((a, b) => moment(a.updatedAt).diff(moment(b.updatedAt)))
      )
      return
    }
    if (value === "byType") {
      setFilteredData([...filteredData].sort((a, b) => a.dealLogType.localeCompare(b.dealLogType))
      )
      return
    }
    if (value === "A-Z") {
      setFilteredData([...filteredData].sort((a, b) => a.message.localeCompare(b.message))
      )
      return
    }
    if (value === "Z-A") {
      setFilteredData([...filteredData].sort((a, b) => b.message.localeCompare(a.message))
      )
      return
    }
  }

  useEffect(() => {
    fetchLeadsLog(id, "")
  }, [])

  useEffect(() => {
    if (logsData?.length) {
      applyFilters();
    }
  }, [date, selectedTypes, searchInput]);

  return (<>
    <Drawer
      title="Logs"
      placement={"right"}
      size="large"
      onClose={onClose}
      open={open}
    >
      <Space direction="vertical" className="px-6">
        <Space direction="horizontal">
          <Form.Item >
            <Input.Search
              placeholder="Quick search"
              value={searchInput} loading={loading}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
            />
          </Form.Item>
          <Form.Item
            label={
              <span style={{ fontWeight: 'bold' }}> Select Dates </span>
            }
          >
            <DatePicker.RangePicker
              value={
                [
                  date.startDate ? dayjs(date.startDate) : null,
                  date.endDate ? dayjs(date.endDate) : null
                ]
              }
              onChange={handleDateRangeChange}
              format="MMM DD, YYYY"
            />
          </Form.Item>
        </Space>
        <Space direction="horizontal">
          <Form.Item
            label={
              <span style={{ fontWeight: 'bold' }}> Select Types </span>
            }
          >
            <Select
              mode="multiple"
              size='small'
              placeholder="Please Select By Type"
              onChange={handleChangeByType}
              options={LeadLogType}
              style={{ width: '21rem' }}
            />
          </Form.Item>
          <Form.Item
            label={
              <span style={{ fontWeight: 'bold' }}> Sort By </span>
            }
          >
            <Select
              size='small'
              placeholder="Sort By"
              onChange={handleSort}
              options={[
                { label: 'Latest', value: 'latest' },
                { label: 'Oldest', value: 'oldest' },
                { label: 'Type', value: 'byType' },
                { label: 'A-Z', value: 'A-Z' },
                { label: 'Z-A', value: 'Z-A' }
              ]}
              defaultValue={'latest'}
              style={{ width: '10rem' }}
            />
          </Form.Item>
        </Space>
      </Space>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }} >
        <Typography.Title level={2}>Timeline</Typography.Title>
      </div>
      {!loading ? filteredData?.length ? <>
        <Timeline
          mode="alternate"
          style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden', padding: '10px' }}
        >
          {filteredData.map((item, index) => (
            <Timeline.Item key={index}>
              <Typography style={{ whiteSpace: 'pre-line' }}>
                {item?.dealLogType === DEAL_LOG_TYPE.FIELD_UPDATED ? (
                  <ul style={{ paddingLeft: '20px' }}>
                    {JSON.parse(item?.message)?.map((line: string, idx: string) => (
                      <li key={idx}>
                        <Typography style={{ whiteSpace: 'pre-line' }}>{line}</Typography>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography style={{ whiteSpace: 'pre-line' }}>{item?.message}</Typography>
                )}
              </Typography>
              <Typography.Text keyboard style={{ color: item?.user?.deletedAt ? "red" : "#1A4895" }}>
                {item?.user?.name} {item?.user?.deletedAt ? "(Deleted)" : ""}
              </Typography.Text>
              <Typography style={{ fontStyle: "italic", fontSize: "12px" }}>at {convertDateFormat(item?.updatedAt)}</Typography>
            </Timeline.Item>
          ))}
        </Timeline>
      </> :
        <div className="flex items-center justify-center h-64" >
          <Typography.Title level={2} type="danger">No data found</Typography.Title>
        </div> :
        <div className="flex items-center justify-center h-64" >
          <Spin tip="Loading" size="large" />
        </div>
      }
    </Drawer>
  </>
  )
}

export default DealLogDrawer
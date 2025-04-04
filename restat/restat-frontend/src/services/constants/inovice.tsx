import { convertDateOnlyFormat } from "../utils/convertDate"
import { DownloadOutlined } from "@ant-design/icons"
import { generateInvoicePDF } from "../utils/generateInvoice"
import { TableColumnsType } from "antd"

const invoiceTable = (): TableColumnsType<any> => {
  return [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      className: 'text-sm text-gray-600',
      render: (date) => (
        <span>
          {convertDateOnlyFormat(date)}
        </span>
      )
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNo',
      render: (text) => (
        <span className="text-black hover:text-tertiary">
          {text}
        </span>
      ),
      className: 'text-sm'
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      align: 'right',
      render: (amount) => (
        <span className="text-sm text-gray-600">
          $ {amount.toFixed(2)}
        </span>
      )
    },
    {
      title: 'Download Invoice',
      width: 50,
      render: (_, record) => {
        return <button
          className="p-2 hover:bg-tertiary  rounded-lg transition-colors"
          onClick={() => generateInvoicePDF(record.id)}
        >
          <DownloadOutlined className="h-4 w-4 hover:text-white" />
        </button>
      }
    }
  ]
}

export default invoiceTable
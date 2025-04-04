import { Button, Card, Switch, Table } from 'antd'
import { apis } from '../../services'
import BaseCardBilling from '../payments/base-card'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../services/redux/store'
import invoiceTable from '../../services/constants/inovice'


const Invoices: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState([])
  const user = useSelector((state: RootState) => state.user.user);

  const fetchInvoices = async () => {
    const { data } = await apis.getAllInvoices()
    setInvoiceData(data)
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  return (
    <BaseCardBilling title='Invoices'>
      <div className="mb-8">
        <Card className="mt-4 p-4 bg-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p>Receive email notifications for new invoices</p>
              <p className="font-thin text-sm">An email will be sent to you to the email address listed below</p>
            </div>
            <Switch checked={false} />
          </div>
          <hr className='my-3' />
          <div className="flex justify-between items-center">
            <div>
              <p>Recipient email</p>
              <p className="font-thin text-sm">{user.email}</p>
            </div>
            <Button className="text-gray-400 p-2 rounded-lg">
              Change email
            </Button>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={invoiceTable()}
          dataSource={invoiceData}
          pagination={{
            showSizeChanger: false,
            pageSize: 5
          }}
          className="[&_.ant-table-thead_.ant-table-cell]:bg-primary [&_.ant-table-thead_.ant-table-cell]:text-black shadow-xl"
        />
      </div>
    </BaseCardBilling>
  )
}

export default Invoices
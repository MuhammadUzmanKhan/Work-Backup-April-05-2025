import { Descriptions, Typography } from "antd";
import { Contact, BidDetails } from "../../services/types/bids";
// import { ROLE } from "../../services/types/common";
import { images } from "../../assets";
import { convertDateFormat } from "../../services/utils/convertDate";

const Account = ({ bidDetails, updateValue, role }: { bidDetails: BidDetails, updateValue: (key: keyof Contact, value: string | number | boolean) => void, role: string }) => {
  const account = bidDetails?.contact

  return (
    <Descriptions
      title="Contact Information"
      bordered
      layout="vertical"
      size="small"
      extra={<div className="flex items-center">
        <a
          href={`${window.location.origin}/contacts/${bidDetails.contact.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ant-btn ant-btn-link d-flex px-5"
        >
          <Typography.Text className="text-gray-500 pr-3">View Contact</Typography.Text>
          <img width={20} src={images.pointingArrow2} alt="pointer" />
        </a>
      </div>}
    >
      <Descriptions.Item label="Name">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('name', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.name || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Email">
        <Typography.Text
          // editable={
          //   role === ROLE.COMPANY_ADMIN
          //     ? {
          //       onChange: (value) => {
          //         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          //         if (emailRegex.test(value)) {
          //           updateValue('email', value);
          //         } else {
          //           message.error('Please enter a valid email address');
          //         }
          //       }
          //     }
          //     : false
          // }
          onClick={(e) => e.preventDefault()}
        >
          {account?.email || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Phone Number">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('phoneNumber', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.phoneNumber || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Country">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('locationCountry', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.locationCountry || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="State">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('locationState', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.locationState || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Payment Method">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('paymentMethod', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.paymentMethod || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Rating">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('rating', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.rating || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Upwork Plus">
        <Typography.Text
          onClick={(e) => e.preventDefault()}
        >
          {account?.upworkPlus ? 'Yes' : 'No'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Total Spent">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('historyTotalSpent', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.historyTotalSpent || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Open Jobs">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('historyOpenJobs', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.historyOpenJobs || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Jobs Posted">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('historyJobsPosted', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.historyJobsPosted || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Interviews">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('historyInterviews', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.historyInterviews || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Hours Billed">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('historyHoursBilled', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.historyHoursBilled || 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Member Since">
        <Typography.Text
          // editable={role === ROLE.COMPANY_ADMIN ? { onChange: (value) => updateValue('historyMemberJoined', value) } : false}
          onClick={(e) => e.preventDefault()}
        >
          {account?.historyMemberJoined ? convertDateFormat(account?.historyMemberJoined) : 'N/A'}
        </Typography.Text>
      </Descriptions.Item>
    </Descriptions>
  );
};

export default Account;

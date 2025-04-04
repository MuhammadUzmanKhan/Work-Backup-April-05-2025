import { TableColumnsType, Tooltip, Avatar } from "antd";
import { ClockCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { IContact } from "../types/contacts";
import { convertDateFormat } from "../utils/convertDate";
import { CONTACT_SOURCE } from "../types/common";
import { getInitials } from "../utils/helpers";
import { images } from "../../assets";
import moment from "moment";

export const getContactsTableHeadings = (
  handleViewLogsIcon: (contactId: string) => void,
  handleViewDetailsIcon: (slug: string) => void
): TableColumnsType<IContact> => {
  return [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: '22%',
      fixed: "left",
      sorter: {
        compare: (a, b) => a.name.localeCompare(b.name),
        multiple: 1
      },
      render: (name: string, row: IContact) => {
        const regex = /\(([^)]+)\)/; // remove ( )
        const displayName = row.source === CONTACT_SOURCE.UPWORK ? (name?.match(regex)?.[1] || name) : name;
        return (
          <Tooltip title={displayName} placement="topLeft">
            {displayName}
          </Tooltip>
        )
      },
    },
    {
      title: "Contact Date",
      key: "createdAt",
      width: '20%',
      ellipsis: { showTitle: false },
      sorter: {
        compare: (a: IContact, b: IContact) => {
          const getEarliestDate = (contact: IContact) => {
            if (contact.source === CONTACT_SOURCE.UPWORK && contact.createdAt) {
              return moment(contact.createdAt).valueOf();
            } else if (
              contact.source === CONTACT_SOURCE.LINKEDIN &&
              contact.linkedInReference?.length
            ) {
              const dates = contact.linkedInReference
                .map(ref => ref.createdAt && moment(ref.createdAt).valueOf())
                .filter(Boolean) as number[];
              return Math.min(...dates);
            }
            return 0; // Default for missing dates
          };

          return getEarliestDate(a) - getEarliestDate(b);
        },
        multiple: 2
      },
      render: (row: IContact) => {
        const createdAts: string[] = [];

        if (row?.source === CONTACT_SOURCE.UPWORK && row.createdAt) {
          createdAts.push(convertDateFormat(row.createdAt));
        } else if (row?.source === CONTACT_SOURCE.LINKEDIN && row.linkedInReference?.length) {
          row.linkedInReference.forEach(ref => {
            if (ref.createdAt) {
              createdAts.push(convertDateFormat(ref.createdAt));
            }
          });
        }

        const tooltipContent = createdAts.length ? createdAts.join('<br />') : 'N/A';

        return (
          <Tooltip
            title={<span dangerouslySetInnerHTML={{ __html: tooltipContent }} />}
            placement="topLeft"
          >
            <div dangerouslySetInnerHTML={{ __html: createdAts.join('<br />') }} />
          </Tooltip>
        );
      }
    },
    {
      title: "LinkedIn Connection Date",
      key: "linkedinConnectedDate",
      width: '20%',
      sorter: {
        compare: (a: IContact, b: IContact) => {
          const getEarliestConnectionDate = (contact: IContact) => {
            if (contact.source === CONTACT_SOURCE.LINKEDIN && contact.linkedInReference?.length) {
              const dates = contact.linkedInReference
                .map(ref => ref.linkedinConnectedDate && moment(ref.linkedinConnectedDate).valueOf())
                .filter(Boolean) as number[];
              return Math.min(...dates);
            }
            return 0; // Default for missing dates
          };

          return getEarliestConnectionDate(a) - getEarliestConnectionDate(b);
        },
        multiple: 3
      },
      render: (row: IContact) => {
        const linkedinConnectedDates: string[] = [];

        if (row?.source === CONTACT_SOURCE.LINKEDIN && row.linkedInReference?.length) {
          row.linkedInReference.forEach(ref => {
            if (ref?.linkedinConnectedDate) {
              linkedinConnectedDates.push(ref.linkedinConnectedDate);
            }
          });
        }

        if (linkedinConnectedDates.length) {
          const tooltipContent = linkedinConnectedDates.join('<br />');
          return (
            <Tooltip
              title={<span dangerouslySetInnerHTML={{ __html: tooltipContent }} />}
              placement="topLeft"
            >
              <div dangerouslySetInnerHTML={{ __html: linkedinConnectedDates.join('<br />') }} />
            </Tooltip>
          );
        }

        return null;
      }
    },
    {
      title: "Business Developer",
      key: "businessDeveloper",
      width: '15%',
      sorter: {
        compare: (a: IContact, b: IContact) => {
          const getDeveloperNames = (contact: IContact) =>
            contact.source === CONTACT_SOURCE.UPWORK
              ? contact.bid?.map(b => b?.user?.name).join(', ') || ''
              : contact.linkedInReference?.map(ref => ref?.user?.name).join(', ') || '';

          return getDeveloperNames(a).localeCompare(getDeveloperNames(b));
        },
        multiple: 4
      },
      render: ({ source, bid, linkedInReference }: IContact) => {
        const names = source === CONTACT_SOURCE.UPWORK
          ? bid?.map(b => b?.user?.name)
          : linkedInReference?.map(ref => ref?.user?.name);

        const initials = names?.map(name => getInitials(name));

        const isDeleted = source === CONTACT_SOURCE.UPWORK
          ? bid?.map(b => !!b?.user?.deletedAt)
          : linkedInReference?.map(ref => !!ref?.user?.deletedAt);

        return (
          <Tooltip title={names?.join(', ')} placement="topLeft">
            {initials?.map((initial, index) => (
              <Avatar
                key={index}
                style={{
                  backgroundColor: isDeleted[index] ? 'red' : '#1890ff',
                }}
              >
                {initial}
              </Avatar>
            ))}
          </Tooltip>
        );
      },
    },
    {
      title: "Profile",
      key: "profile",
      width: '15%',
      sorter: {
        compare: (a: IContact, b: IContact) => {
          const getProfileNames = (contact: IContact) =>
            contact.source === CONTACT_SOURCE.UPWORK
              ? contact.bid?.map(b => b?.bidProfile?.name).join(', ') || ''
              : contact.linkedInReference?.map(ref => ref?.profile?.name).join(', ') || '';

          return getProfileNames(a).localeCompare(getProfileNames(b));
        },
        multiple: 5
      },
      render: ({ source, bid, linkedInReference }: IContact) => {
        const profileNames = source === CONTACT_SOURCE.UPWORK
          ? bid?.map(b => b?.bidProfile?.name)
          : linkedInReference?.map(ref => ref?.profile?.name);

        const profileInitials = profileNames?.map(name => getInitials(name));

        const isDeleted = source === CONTACT_SOURCE.UPWORK
          ? bid?.map(b => !!b?.bidProfile?.deletedAt)
          : linkedInReference?.map(ref => !!ref?.profile?.deletedAt);

        return (
          <Tooltip title={profileNames?.join(', ')} placement="topLeft">
            {profileInitials?.map((initial, index) => (
              <Avatar
                key={index}
                style={{
                  backgroundColor: isDeleted[index] ? 'red' : '#87d068',
                  marginRight: 5
                }}
              >
                {initial}
              </Avatar>
            ))}
          </Tooltip>
        );
      },
    },
    {
      title: "Source",
      dataIndex: 'source',
      key: "source",
      width: '10%',
      sorter: {
        compare: (a: IContact, b: IContact) => a.source.localeCompare(b.source),
        multiple: 6
      },
      render: (value) => {
        return (
          <Tooltip title={value} placement="topLeft">
            <img width={25} src={value === CONTACT_SOURCE.UPWORK ? images.upwork : value === CONTACT_SOURCE.LINKEDIN ? images.linkedin : null} />
          </Tooltip>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: '12%',
      render: ({ id, slug }: IContact) => (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <Tooltip arrow title={'View Details'} >
            <EyeOutlined
              style={{ fontSize: "20px", color: "grey" }}
              onClick={() => handleViewDetailsIcon(slug)}
            />
          </Tooltip>
          <Tooltip arrow title={'See Logs'} >
            <ClockCircleOutlined
              style={{ fontSize: "20px", color: 'grey' }}
              onClick={() => handleViewLogsIcon(id)}
            />
          </Tooltip>
        </div>
      ),
    }
  ];
};

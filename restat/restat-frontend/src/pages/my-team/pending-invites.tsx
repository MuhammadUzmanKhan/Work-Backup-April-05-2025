import { useEffect, useState } from 'react';
import './invite.scss';
import { images } from "../../assets";
import { Pagination, Table, Button } from "antd";
import { apis, useLoader } from '../../services';
import { ActionButton, customNotification } from '../../components';
import Swal from 'sweetalert2';
import { getPendingInvitesColumns } from '../../services/constants/pending-invites';
import { CloseOutlined } from '@ant-design/icons';

interface IPendingInvites {
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const PendingInvites = () => {
  const [page, setPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(20)
  const [usersCount, setUsersCount] = useState(0)
  const [showModal, setShowModal] = useState(false);
  const { loading, on, off } = useLoader()
  const [pendingInvites, setPendingInvites] = useState<IPendingInvites[]>([])

  const fetchData = async () => {
    try {
      on();
      const { data } = await apis.getPendingInvites(page);
      setPendingInvites(data.users)
      setUsersPerPage(data.usersPerPage)
      setUsersCount(data.usersCount)

    } catch (error: any) {
      console.error(error)
      customNotification.error(error?.response?.data?.message || 'An Error Occurred!')
    } finally {
      off();
    }
  };

  const resendEmail = async (row: any) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to resend the email?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, resend it!'
    });

    if (result.isConfirmed) {
      try {
        await apis.addTeamMember([{ name: row?.name, email: row?.email, role: row?.role }]);
        customNotification.success('Email Resent Successfully.');
      } catch (error: any) {
        console.error(error);
        if (error?.response?.data?.message) {
          customNotification.error(error?.response?.data?.message);
        } else {
          customNotification.error('An Error Occurred!');
        }
      }
    }
  };

  const deleteInvite = async (row: any) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await apis.deleteInvite(row?.id);
        fetchData()
        customNotification.success('Invitation Deleted Successfully.');
      } catch (error: any) {
        console.error(error);
        if (error?.response?.data?.message) {
          customNotification.error(error?.response?.data?.message);
        } else {
          customNotification.error('An Error Occurred!');
        }
      }
    }
  };

  useEffect(() => {
    showModal && fetchData();
  }, [showModal]);


  return (
    <>
      <ActionButton
        text="Invites"
        tooltip='Pending Invites'
        onClick={() => setShowModal(true)}
        icon={
          <img
            src={images.pendingInvite}
            alt="invits"
            className="w-4 h-4"
          />
        }
      />
      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden\
                     overflow-y-auto fixed inset-0 z-50 outline-none\
                     focus:outline-none">
            <div className="relative w-full max-w-6xl max-h-full">
              <div className="relative bg-white min-h-[80vh] rounded-lg shadow flex flex-col justify-between">
                <div>
                  <div className="header-modal flex items-center justify-between px-6 py-2 border-b rounded-t">
                    <div className="title-modal flex items-center bg-white rounded-lg px-4 py-1 min-h-[1.5rem]">
                      <Button type="link">My Team</Button>
                      <span className="mx-2">	&gt; </span>
                      <Button type="link">Pending Invites</Button>
                    </div>
                    <div className="flex actionBtns">
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => setShowModal(false)}
                      />
                    </div>
                  </div>
                  <div className="border-b-[#b3cee19e] px-6 py-3 md-heading flex items-center justify-between">
                    <h2 className="text-[1.375rem]">Pending Invitations</h2>
                  </div>
                  <div className="px-6">
                    <Table
                      className="custom-table"
                      columns={getPendingInvitesColumns({ resendEmail, deleteInvite })}
                      dataSource={pendingInvites}
                      pagination={false}
                      scroll={{ x: 500, y: 'calc(90vh - 300px)' }}
                      size='small'
                      loading={loading}
                    />
                  </div>
                </div>
                <div className="py-4">
                  <Pagination
                    showQuickJumper
                    total={usersCount}
                    defaultCurrent={page}
                    current={page}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                    onChange={(page) => setPage(page)}
                    onShowSizeChange={(current, size) => setUsersPerPage(size)}
                    pageSize={usersPerPage}
                    defaultPageSize={usersPerPage}
                    className='flex justify-center'
                  />
                </div>
              </div>

            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
}

export default PendingInvites;

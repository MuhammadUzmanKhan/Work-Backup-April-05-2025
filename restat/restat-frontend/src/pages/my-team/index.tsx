import React, { useEffect, useState } from "react";
import Layout from "../../components/layout";
import { apis } from "../../services";
import { UsersObject } from "../../services/types/common";
import { useDispatch, useSelector } from "react-redux";

import {
  setusers,
  setUsersCount,
  setUsersPerPage,
} from "../../services/redux/features/company-users/users.slice";
import { RootState } from "../../services/redux/store";
import Invite from "./invite";
import PendingInvites from "./pending-invites";
import { Pagination, PaginationProps, Space, Table } from "antd";
import { getUsersTableHeadings } from "../../services/constants/teams";
import UserModal from "../../components/user-details";
import DeleteModal from "../../components/delete-modal";
import { customNotification } from "../../components";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";

const AllUsers = React.memo(() => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  const usersCount = useSelector((state: RootState) => state.companyUsers.usersCount);
  const usersPerPage = useSelector((state: RootState) => state.companyUsers.usersPerPage);
  const [userModal, setUserModal] = useState<{ show: boolean, data: any }>({
    show: false,
    data: null
  })
  const [deleteUser, setDeleteUser] = useState<{ show: boolean, id: string }>({
    show: false,
    id: ""
  })

  const users = useSelector((state: RootState) => state.companyUsers.users);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: users } = await apis.getCompanyUsers(page, usersPerPage);
      let usersData: UsersObject = [];
      for (const user of users.users) {
        if (!user.deleted) {
          usersData.push({
            name: user?.name,
            email: user?.email,
            role: user?.role,
            joiningDate: user?.createdAt,
            id: user.id,
            upworkTarget: user?.upworkTarget,
            linkedinTarget: user?.linkedinTarget,
            clickupUsername: user?.clickupUsername,
            clickupEmail: user?.clickupEmail,
            clickupProfilePicture: user?.clickupProfilePicture,
          });
        }
      }
      setPage(users?.page)
      dispatch(setusers(usersData));
      dispatch(setUsersCount(users?.usersCount));
      dispatch(setUsersPerPage(users?.usersPerPage));
    } catch (error: any) {
      customNotification.error(error?.response?.data?.message || 'An Error Occurred!')
    } finally {
      setLoading(false);
    }
  };

  const onPaginationChange: PaginationProps['onChange'] = (pageNumber) => {
    setPage(pageNumber)
  };

  const onPerPageChange: PaginationProps['onShowSizeChange'] = (_, pageSize) => {
    dispatch(setUsersPerPage(pageSize));
  }

  const handleEditUser = (data: any) => setUserModal({ show: true, data });
  const handleDeleteUser = (data: any) => setDeleteUser({ show: true, id: data.id });

  useEffect(() => {
    fetchData();
  }, [usersPerPage, page]);

  useEffect(() => {
    dispatch(setHeaderData({
      title: "My Team",
      actionButtons: [
        <Invite usersCount={usersCount} />,
        <PendingInvites />
      ]
    }))
  }, [usersCount]);

  return (
    <Layout>
      <div className="flex justify-between items-center flex-col gap-3">
        <Table
          className="custom-table"
          columns={getUsersTableHeadings({ handleEditUser, handleDeleteUser })}
          dataSource={users}
          pagination={false}
          scroll={{ x: 1500, y: 'calc(100vh - 16.3rem)' }}
          size="large"
          loading={loading}
        />
        {usersCount ? <Space direction="horizontal" size={12} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            showQuickJumper
            total={usersCount}
            defaultCurrent={page}
            current={page}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            onChange={onPaginationChange}
            defaultPageSize={usersPerPage}
            pageSize={usersPerPage}
            onShowSizeChange={onPerPageChange}
          />
        </Space> : null}
      </div>
      {userModal.show &&
        <UserModal
          title={"Employee"}
          showModal={userModal.show}
          closeModal={() => setUserModal({ show: false, data: null })}
          userDetails={userModal.data}
          fetchUsers={fetchData}
        />
      }
      {deleteUser.show && (
        <DeleteModal
          showDeleteModal={deleteUser.show}
          heading="User"
          title="User"
          userId={deleteUser.id}
          closeDeleteModal={() => setDeleteUser({ show: false, id: "" })}
          fetchUsers={fetchData}
        />
      )}
    </Layout>
  );
});
export default AllUsers;

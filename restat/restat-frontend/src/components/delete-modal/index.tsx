import React from "react";
import { apis, useLoader } from "../../services";
import { PortfolioObject } from "../../services/types/common";
import customNotification from "../notification";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const DeleteModal = React.memo(
  ({
    title,
    userId,
    heading,
    profileId,
    industryId,
    portfolio,
    fetchUsers,
    showDeleteModal,
    closeDeleteModal,
  }: {
    title: string;
    userId?: string
    heading: string;
    profileId?: string;
    industryId?: string;
    closeDeleteModal: any;
    fetchUsers?: () => void
    showDeleteModal: boolean;
    portfolio?: PortfolioObject;
  }) => {
    const { on, off, loading } = useLoader();
    const handleClick = async () => {
      try {
        on();
        if (portfolio) {
          await apis.deletePortfolio(portfolio?.id);
          fetchUsers && fetchUsers()
        } else if (userId) {
          await apis.deleteUser(userId)
          fetchUsers && fetchUsers()
        } else if (profileId) {
          await apis.deleteProfile(profileId)
          fetchUsers && fetchUsers()
        } else if (industryId) {
          await apis.deleteIndustry(industryId)
          fetchUsers && fetchUsers()
        }
        customNotification.success("Success!", `${title} deleted successfully!`);
      } catch (error: any) {
        customNotification.error("Error!", error?.response?.data?.message || "Something went wrong!");
      } finally {
        off();
        closeDeleteModal();
      }
    };
    return (
      <>
        {showDeleteModal && (
          <>
            <div
              className="justify-center items-center flex overflow-x-hidden\
                      overflow-y-auto fixed inset-0 z-50 outline-none\
                      focus:outline-none"
            >
              <div className="relative w-full max-w-5xl max-h-full">
                <div className="relative bg-white rounded-lg shadow">
                  <div className="header-modal flex items-center justify-between px-6 py-2 border-b rounded-t">
                    <div className="title-modal flex items-center bg-white rounded-lg px-4 py-1 min-h-[1.5rem]">
                      <Button type="link">{heading} Management</Button>
                      <span className="mx-2"> &gt; </span>
                      <Button type="link">{title}</Button>
                    </div>
                    <div className="flex actionBtns">
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={closeDeleteModal}
                      />
                    </div>
                  </div>
                  <div className="text-center text-gray-500 mt-10">
                    Are you sure you want to delete this {title}?
                  </div>
                  <div className="flex justify-end text-right p-5">
                    <Button
                      className="mr-5 font-bold bg-[#1A4895]"
                      style={{ borderColor: '#5682CD' }}
                      type="primary"
                      onClick={handleClick}
                      loading={loading}
                    >
                      Delete
                    </Button>
                    <Button
                      className="font-bold"
                      type="primary"
                      style={{ backgroundColor: '#D11A2A', borderColor: '#D11A2A' }}
                      onClick={closeDeleteModal}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
          </>

        )}
      </>
    );
  }
);

export default DeleteModal;

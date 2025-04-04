import React, { useEffect, useState } from "react";
import "../index.scss";
import { images } from "../../assets";
import { Button, DatePicker, Form, Input, Popconfirm, Spin, Tooltip } from "antd";
import { Mail, UserCheck } from "../../assets/images/svg-react-component";
import { Formik } from "formik";
import { userValidationSchema } from "../../services/utils/validation-schemas";
import { apis, useLoader } from "../../services";
import { ROLE, UsersObject } from "../../services/types/common";
import { formattedDate } from "../../services/utils/date";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import moment from "moment";
import RoleDropdown from "../role-dropdown";
import { useAuth } from "../../services/hooks/handleLogout";
import customNotification from "../notification";
import cleanAndTrimWhitespace from "../../services/utils/trimSpaces";


const UserModal = React.memo(
  ({
    title,
    showModal,
    closeModal,
    userDetails,
    fetchUsers,
  }: {
    title: string;
    showModal: boolean;
    closeModal: any;
    userDetails: UsersObject;
    fetchUsers?: () => void;
  }) => {
    const { loading, on, off } = useLoader();
    const [selectedRole, setSelectedRole] = useState({ label: "", image: "" });
    const [forgotPasswordLoader, setForgotPasswordLoader] = useState(false)
    const [startDate, setStartDate] = useState(
      new Date(userDetails?.joiningDate)
    );
    const date = formattedDate(userDetails?.joiningDate);

    const { handleLogout } = useAuth()

    const setTheSelectedRole = () => {
      if (userDetails && userDetails.role) {
        if (userDetails.role === ROLE.OWNER) {
          setSelectedRole({ label: "Owner", image: images.admin });
        } else if (userDetails.role === ROLE.BIDDER) {
          setSelectedRole({ label: "Business Developer", image: images.user });
        } else if (userDetails.role === ROLE.COMPANY_ADMIN) {
          setSelectedRole({ label: "Admin", image: images.admin });
        }
      }
    };

    useEffect(() => {
      setTheSelectedRole();
      setStartDate(userDetails?.joiningDate);
    }, [userDetails]);

    const closeTheModal = () => {
      closeModal();
      setTheSelectedRole();
      setStartDate(userDetails?.joiningDate);
    };

    const handleRoleChange = (role: any) => {
      setSelectedRole(role);
    };

    const initialValues = {
      upworkTarget: +(userDetails?.upworkTarget || 0),
      linkedinTarget: +(userDetails?.linkedinTarget || 0),
      name: userDetails?.name || "",
      email: userDetails?.email || "",

    };

    const roleOptions = [
      { label: "Owner", image: images.admin },
      { label: "Business Developer", image: images.user },
      { label: "Admin", image: images.admin },
    ];

    const submit = async ({ name, email, upworkTarget, linkedinTarget }: { name: string; email: string, upworkTarget: number, linkedinTarget: number }) => {
      if (userDetails?.role === ROLE.OWNER) {
        customNotification.warning("You cannot change details of the company owner.");
        return;
      }

      name = cleanAndTrimWhitespace(name);
      email = cleanAndTrimWhitespace(email);

      const user = JSON.parse(localStorage.getItem("USER_OBJECT") as string);
      if (user?.email === email) {
        handleLogout(
          "Logging You Out!",
          "You'll be logged out of your current session since your user role was changed.",
          "question",
          false,
          "#3085d6",
          "#d33",
          "Proceed"
        );
      }
      let role =
        selectedRole?.label === "Owner" ? ROLE.OWNER :
          selectedRole?.label === "Business Developer"
            ? ROLE.BIDDER
            : selectedRole?.label === "Admin"
              ? ROLE.COMPANY_ADMIN
              : "";

      const date = moment(startDate).toISOString()
      const userId = userDetails?.id;
      const formValuesChanged =
        name !== initialValues.name ||
        role !== userDetails.role ||
        date.substring(0, 10) !== userDetails.joiningDate.substring(0, 10) ||
        upworkTarget !== userDetails?.upworkTarget ||
        linkedinTarget !== userDetails?.linkedinTarget
      if (!formValuesChanged) {
        customNotification.warning(
          "Update operation cannot be performed as nothing has changed."
        );
        closeModal();
        return;
      }
      try {
        on();
        await apis.updateUser({ id: userId, name, role, joiningDate: date, upworkTarget, linkedinTarget });
        if (user?.email !== email) fetchUsers && fetchUsers();
        await apis.revokeUserSession(userId);
        customNotification.success("User Successfully Updated.");
        closeModal();
      } catch (err: any) {
        if (err.response.status !== 401) customNotification.error(err?.response?.data?.message || "Something went wrong while updating the user");
      } finally {
        off();
      }
    };

    const sendForgotPasswordEmail = async () => {
      if (userDetails?.role === ROLE.OWNER) {
        customNotification.warning("You cannot change details of the company owner.");
        return;
      }
      const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to send a password reset email?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, send it!',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
      });

      if (confirmResult.isConfirmed) {
        try {
          setForgotPasswordLoader(true)
          const resp = await apis.sendForgotPasswordEmail({ userId: userDetails.id });

          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: resp?.data?.message || 'Email sent successfully',
            showConfirmButton: true
          });
        } catch (error: any) {
          if (error?.response?.data?.message) {
            customNotification.error(error?.response?.data?.message);
          } else {
            console.error('Error occurred in sendForgotPasswordEmail', error);
            customNotification.error('Error occurred in sendForgotPasswordEmail');
          }

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error occurred in sending the email',
            showConfirmButton: true
          });
        } finally {
          setForgotPasswordLoader(false)
        }
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Cancelled',
          text: 'Password reset email was not sent',
          showConfirmButton: true
        });
      }
    };
    return (
      <>
        (
        <>
          <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
          >
            <div className="relative w-full max-w-4xl max-h-full">
              <div className="relative bg-white rounded-lg shadow">
                <div className="header-modal flex items-center justify-between px-6 py-2 border-b rounded-t">
                  <div className="title-modal flex items-center bg-white rounded-lg px-4 py-1 min-h-[1.5rem]">
                    <button>{title}</button>
                    <span className="mx-2"> &gt; </span>
                    <button>{title} Details</button>
                  </div>
                  <div className="flex actionBtns">
                    <button
                      type="button"
                      className="text-gray-400 bg-white btn-in border rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
                      data-modal-hide="defaultModal"
                      onClick={closeTheModal}
                    >
                      <img src={images.cross} alt="cross icon" />
                    </button>
                  </div>
                </div>
                <div className="border-b border-b-[#b3cee19e] py-2 px-4 md-heading flex items-center justify-between">
                  <h2 className="text-[1.375rem]">Details</h2>
                  <div className="created-date">
                    <div className="pl-2 font-medium text-gray-400">
                      Created:
                    </div>
                    <p>{date}</p>
                  </div>
                </div>
                <div className="user-modal-card p-6">
                  <Formik
                    initialValues={initialValues}
                    validationSchema={userValidationSchema}
                    onSubmit={submit}
                  >
                    {({
                      values,
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      errors,
                      touched
                    }) => (
                      <Form
                        layout="vertical"
                        className="mx-auto"
                        onFinish={handleSubmit}
                      >
                        <Form.Item
                          label="Name"
                          validateStatus={touched.name && errors.name ? 'error' : 'success'}
                          help={touched.name && errors.name ? String(errors.name) : null}
                          className="w-full"
                        >
                          <Input
                            name="name"
                            placeholder="John Doe"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            prefix={<UserCheck className="field-icon-left" fillColor={touched.name ? (errors.name ? 'red' : 'green') : 'none'} />}
                            disabled={userDetails?.role === ROLE.OWNER ? true : false}
                          />
                        </Form.Item>

                        <Form.Item
                          label="Email"
                          validateStatus={touched.email && errors.email ? 'error' : 'success'}
                          help={touched.email && typeof errors.email === 'string' ? errors.email : null}
                          className="w-full"
                        >
                          <Input
                            name="email"
                            type="email"
                            placeholder="example123@gmail.com"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            prefix={<Mail className="field-icon-left" fillColor={touched.email ? (errors.email ? 'red' : 'green') : 'none'} />}
                            disabled={true}
                          />
                        </Form.Item>

                        <Form.Item
                          label="Role"
                          rules={[{ required: true, message: 'Please select a role!' }]}
                          className="w-full"
                        >
                          {
                            userDetails?.role === ROLE.OWNER
                              ?
                              <Input
                                value="Owner"
                                disabled={true}
                                style={{ maxWidth: '250px' }}
                                prefix={<img src={images.admin} alt={"admin"} width={20} style={{ marginRight: 8 }} />}
                              /> :
                              <RoleDropdown
                                options={roleOptions}
                                value={selectedRole}
                                onChange={handleRoleChange}
                              />}
                        </Form.Item>

                        <div className="flex space-x-4">
                          <Form.Item
                            label="Upwork Target (M)"
                            validateStatus={touched.upworkTarget && errors.upworkTarget ? 'error' : 'success'}
                            help={touched.upworkTarget && errors.upworkTarget ? errors.upworkTarget : null}
                            className="w-1/2"
                          >
                            <Input
                              name="upworkTarget"
                              type="number"
                              value={values.upworkTarget}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              prefix={<img src={images.upwork} width={15} style={{ marginRight: '20px' }} />}
                              disabled={userDetails?.role === ROLE.OWNER ? true : false}
                            />
                          </Form.Item>

                          <Form.Item
                            label="LinkedIn Target (M)"
                            validateStatus={touched.linkedinTarget && errors.linkedinTarget ? 'error' : 'success'}
                            help={touched.linkedinTarget && errors.linkedinTarget ? errors.linkedinTarget : null}
                            className="w-1/2"
                          >
                            <Input
                              name="linkedinTarget"
                              type="number"
                              value={values.linkedinTarget}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              prefix={<img src={images.linkedin} width={15} style={{ marginRight: '20px' }} />}
                              disabled={userDetails?.role === ROLE.OWNER ? true : false}
                            />
                          </Form.Item>
                        </div>
                        <Form.Item
                          label="Joining Date"
                          rules={[{ required: true, message: 'Please select a date!' }]}
                          className="w-full"
                        >
                          <Tooltip title="This field is not editable">
                            <DatePicker
                              format={"MMM DD, YYYY"}
                              allowClear={false}
                              value={dayjs(startDate)}
                              style={{ minWidth: '250px' }}
                              disabled={true}
                            />
                          </Tooltip>
                        </Form.Item>

                        <div className="forgot-password-container mb-4">
                          <h3>Forgot Password</h3>
                          {forgotPasswordLoader ? (
                            <Spin />
                          ) : userDetails?.role === ROLE.OWNER ? (
                            <Button disabled style={{ backgroundColor: '#d9d9d9', color: '#8c8c8c', cursor: 'not-allowed' }}>
                              Send New Password Email
                            </Button>
                          ) : (
                            <Button onClick={sendForgotPasswordEmail}>
                              Send New Password Email
                            </Button>
                          )}
                        </div>

                        <Form.Item className="flex justify-end">
                          <Button
                            className="danger-color text-white rounded-lg py-3 px-5 font-bold"
                            onClick={closeModal}
                          >
                            Cancel
                          </Button>
                          {userDetails?.role === ROLE.OWNER ? (
                            <Button
                              disabled
                              style={{
                                backgroundColor: '#d9d9d9',
                                color: '#8c8c8c',
                                marginLeft: '10px',
                                cursor: 'not-allowed',
                              }}
                            >
                              Update
                            </Button>
                          ) : (
                            <Popconfirm
                              title="Update the User"
                              description="Please note that you are going to update the information so we need a confirmation!"
                              okText="Confirm"
                              okButtonProps={{ style: { backgroundColor: 'blue', color: 'white' } }}
                              cancelText="Cancel"
                              onConfirm={() => handleSubmit()}
                            >
                              <Button
                                danger
                                key="save"
                                type="primary"
                                style={{ backgroundColor: '#1A4895', marginLeft: '10px' }}
                                loading={loading}
                              >
                                Update
                              </Button>
                            </Popconfirm>
                          )}

                        </Form.Item>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
        )
      </>
    )
  })
export default UserModal;

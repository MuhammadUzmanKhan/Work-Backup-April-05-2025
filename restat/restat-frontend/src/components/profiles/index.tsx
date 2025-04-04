import React from "react"; // , { useEffect, useState }
import "../index.scss";
import { Url, UserCheck } from "../../assets/images/svg-react-component";
import { Formik } from "formik";
import { Input } from "../../components";
import { profileValidationSchema } from "../../services/utils/validation-schemas";
import { apis, useLoader } from "../../services";
import { ProfileSource, UsersObject, ProfileType } from "../../services/types/common";
import { convertDateFormat } from "../../services/utils/convertDate";
import { customNotification } from "..";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import cleanAndTrimWhitespace from "../../services/utils/trimSpaces";

const ProfileModal = React.memo(
  ({
    title,
    showModal,
    fetchData,
    closeModal,
    profileDetails,
    profileType, // Add profileType to props
  }: {
    title: string;
    showModal: boolean;
    closeModal: () => void;
    profileDetails?: UsersObject;
    fetchData?: (page: number) => void;
    profileType?: ProfileType | null; // Added profileType to the props definition
  }) => {
    const { loading, on, off } = useLoader();

    const closeTheModal = () => {
      closeModal();
    };

    const initialValues = {
      name: profileDetails ? profileDetails.profileName : "",
      url: profileDetails ? profileDetails.url : "",
    };
    const date = convertDateFormat(profileDetails?.createdDate);

    const submit = async ({ name, url }: { name: string; url: string }) => {
      try {
        on(); // Start loader

        name = cleanAndTrimWhitespace(name);
        url = cleanAndTrimWhitespace(url);

        // Validate name and URL before proceeding
        if (typeof name !== 'string' || name.trim() === '') {
          customNotification.error("Name must be a non-empty string.");
          return;
        }

        if (typeof url !== 'string' || url.trim() === '') {
          customNotification.error("URL must be a non-empty string.");
          return;
        }

        // Check if updating an existing profile
        if (profileDetails) {
          const formValuesChanged = name !== initialValues.name || url !== initialValues.url;

          if (!formValuesChanged) {
            customNotification.warning("Update operation cannot be performed as nothing has changed.");
            closeModal();
            return;
          }

          if (profileType === ProfileType.UPWORK || url.includes("upwork")) {
            await apis.updateProfile({ id: profileDetails.id, name, url });
            customNotification.success("Upwork Profile Successfully Updated.");
          } else if (profileType === ProfileType.LINKEDIN || url.includes("linkedin")) {
            await apis.updateProfile({ id: profileDetails.id, name, url });
            customNotification.success("LinkedIn Profile Successfully Updated.");
          } else {
            customNotification.error("Invalid profile type.");
          }
        } else {
          // Create a new profile based on type
          if (profileType === ProfileType.UPWORK) {

            await apis.createProfile({ name, url, source: ProfileSource.UPWORK });
            customNotification.success("Upwork Profile Successfully Created.");
          } else if (profileType === ProfileType.LINKEDIN) {
            await apis.createProfile({ name, url, source: ProfileSource.LINKEDIN });
            customNotification.success("LinkedIn Profile Successfully Created.");
          } else {
            customNotification.error("Invalid profile type.");
          }
        }

        // Reload data if necessary
        fetchData?.(1);
        closeModal();

      } catch (err: any) {
        console.error(err);
        customNotification.error(err?.response?.data?.message || 'An error occurred! Please try again later.');
      } finally {
        off();
      }
    };

    return (
      <>
        {showModal && (
          <>
            <div
              className="justify-center items-center flex overflow-x-hidden\
                         overflow-y-auto fixed inset-0 z-50 outline-none\
                         focus:outline-none"
            >
              <div className="relative w-full max-w-4xl max-h-full">
                <div className="relative bg-white rounded-lg shadow">
                  <div className="header-modal flex items-center justify-between px-6 py-2 border-b rounded-t">
                    <div className="title-modal flex items-center bg-white rounded-lg px-4 py-1 min-h-[1.5rem]">
                      <button>Profiles</button>

                      <span className="mx-2"> &gt; </span>
                      <button>
                        {title} {profileDetails ? "Details" : ""}
                      </button>
                    </div>
                    <div className="flex actionBtns">
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={closeTheModal}
                      />
                    </div>
                  </div>
                  <div className="border-b border-b-[#b3cee19e] py-2 px-4 md-heading flex items-center justify-between">
                    <h2 className="text-[1.375rem]">
                      {profileDetails ? "Details" : title}
                    </h2>
                    <div className="created-date">
                      <p>
                        <div className="pl-2 font-medium text-gray-400">Created:</div>
                      </p>
                      <p>{date}</p>
                    </div>
                  </div>
                  <div className="user-modal-card">
                    <Formik
                      initialValues={initialValues}
                      validationSchema={profileValidationSchema}
                      onSubmit={submit}
                    >
                      {({
                        values,
                        handleChange,
                        handleBlur,
                        submitForm,
                        errors,
                        touched,
                      }) => (
                        <div className="mx-10 my-5">
                          <Input
                            label="Name"
                            type="text"
                            placeholder="John Doe"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            name="name"
                            srcLeft={
                              <UserCheck
                                className="field-icon-left"
                                fillColor={
                                  touched.name
                                    ? errors.name
                                      ? "red"
                                      : "green"
                                    : "none"
                                }
                              />
                            }
                            errors={errors.name}
                            touched={touched.name}
                          />
                          <Input
                            label="Profile URL"
                            type="url"
                            placeholder="A valid URL"
                            value={values.url}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            name="url"
                            srcLeft={
                              <Url
                                className="field-icon-left"
                                fillColor={
                                  touched.url
                                    ? errors.url
                                      ? "red"
                                      : "green"
                                    : "none"
                                }
                              />
                            }
                            errors={errors.url}
                            touched={touched.url}
                          />

                          <div className="mt-5"></div>

                          <div className="flex justify-end text-right p-5">
                            <Button
                              className="bg-[#D11A2A] text-white rounded-lg py-3 px-5 font-bold"
                              type="primary"
                              style={{ backgroundColor: '#D11A2A', borderColor: '#D11A2A' }}
                              onClick={closeModal}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="ml-3 bg-[#1A4895] text-white rounded-lg py-3 px-5 font-bold"
                              type="primary"
                              onClick={submitForm}
                              loading={loading}
                            >
                              {profileDetails ? "Update" : "Create"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Formik>
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

export default ProfileModal;

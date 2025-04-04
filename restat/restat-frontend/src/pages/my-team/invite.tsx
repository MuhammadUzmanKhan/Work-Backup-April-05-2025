import React, { useState } from 'react';
import './invite.scss';
import { FieldArray, Formik } from 'formik';
import { membersValidationSchema } from '../../services/utils/validation-schemas';
import { apis, useLoader } from '../../services';
import { AddAnotherUserProps, ErrorProps, InviteSubmitProps, MemberProps } from '../../services/types/common';
import Loader from '../../components/loader';
import FormContent from './form-content';

import { images } from "../../assets";
import { Button } from 'antd';
import { convertDateFormat } from '../../services/utils/convertDate';
import { ActionButton, customNotification } from '../../components';
import { CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import cleanAndTrimWhitespace from '../../services/utils/trimSpaces';
import { useSelector } from 'react-redux';
import { RootState } from '../../services/redux/store';

const Invite: React.FC<{usersCount: number}> = ({usersCount}) => {
  const [showModal, setShowModal] = useState(false);
  const {
    user: { user },
  } = useSelector((state: RootState) => state);

  const { on, off, loading } = useLoader();
  const newDate = convertDateFormat(moment().format());
  const allowedUsers = user.company.subscription ? user.company.subscription?.allowedUsers : null
  
  const handleAddAnotherUser = async ({ validateForm, push, setTouched }: AddAnotherUserProps) => {
    const errors = await validateForm();
    setTouched(errors);
    if (Object.keys(errors).length === 0) {
      push({ name: '', email: '', role: '' })
    }
  };

  const handleSubmit = async (values: InviteSubmitProps, { setErrors }: { setErrors: any }) => {
    const { members } = values;
    members.map(async (member) => {
      member.email = member.email.toLowerCase();
      member = {
        name: cleanAndTrimWhitespace(member.name),
        email: cleanAndTrimWhitespace(member.email),
        role: cleanAndTrimWhitespace(member.role),
        upworkTarget: member.upworkTarget,
        linkedinTarget: member.linkedinTarget,
      };

      const { data: { userExists } } = await apis.userExists(member.email);
      if (userExists) return;
    });

    const formikError: ErrorProps[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (members[i].email === members[j].email) {
          for (let k = 0; k < j; k++) {
            if (k === i) {
              formikError.push({ email: 'Duplicate Email' });
            } else {
              formikError.push({});
            }
          }
          formikError.push({ email: 'Duplicate Email' });
        }
      }
    }

    if (formikError.length === 0) {
      try {
        on();
        const result = await apis.addTeamMember(members);
        customNotification.success(result.data.message);
        setShowModal(false);
      } catch (error: any) {
        if (error?.response?.status !== 409) {
          const message = error?.response?.data?.message ?? 'An Error Occurred!';
          customNotification.error(message);
        }

        if (error?.response?.status === 409) {
          const backendErrorMessage = error?.response?.data?.message;
          error?.response?.data?.members?.forEach((item: MemberProps, index: number) => {
            const idx = members.findIndex((values) => values.email === item.email);
            for (let i = index; i < idx; i++) {
              formikError.push({});
            }
            formikError.push({ email: backendErrorMessage });
          });
          setErrors({ members: formikError });
        }
      } finally {
        off();
      }
    } else {
      setErrors({ members: formikError });
    }
  };

  return (
    <>
      <ActionButton
        text="Add"
        tooltip='Add Team Member'
        onClick={() => setShowModal(true)}
        disable={
          (user?.company?.subscription?.isActive === false ? true : false) || 
          allowedUsers ? (usersCount >= allowedUsers! ? true : false) : false
        }
        icon={
          <img
            src={images.add_team_members}
            alt="add"
            className="w-4 h-4"
          />
        }
      />
      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-full max-w-5xl max-h-full">
              <div className="relative bg-white rounded-lg shadow">
                <div className="header-modal flex items-center justify-between px-6 py-2 border-b rounded-t">
                  <div className="title-modal flex items-center bg-white rounded-lg px-4 py-1 min-h-[1.5rem]">
                    <Button type="link">My Team</Button>
                    <span className="mx-2">	&gt; </span>
                    <Button type="link">Add Members</Button>
                  </div>
                  <div className="flex actionBtns">
                    <Button
                      type='text'
                      icon={<CloseOutlined />}
                      onClick={() => setShowModal(false)}
                    />
                  </div>
                </div>
                <div className="border-b border-b-[#b3cee19e] p-6 md-heading flex items-center justify-between">
                  <h2 className="text-[1.375rem]">Add Team Members</h2>
                  <div className="created-date">
                    <p><strong className="font-medium">Creating:</strong></p>
                    <p>{convertDateFormat(newDate)}</p>
                  </div>
                </div>
                <Formik
                  initialValues={{
                    members: [
                      {
                        name: '',
                        email: '',
                        role: '',
                        upworkTarget: 0,
                        linkedinTarget: 0,
                      }
                    ]
                  }}
                  validationSchema={membersValidationSchema}
                  onSubmit={handleSubmit}
                >{({
                  values,
                  setFieldValue,
                  handleChange,
                  submitForm,
                  validateForm,
                  handleBlur,
                  errors,
                  touched,
                  setTouched
                }) => (
                  <>
                    <FieldArray name="members">
                      {({ push, remove }) => (
                        <div className="p-6 space-y-6 max-w-[50rem] max-h-[30rem] overflow-y-auto">
                          {values.members.map((member, index) => (
                            <FormContent
                              touched={touched}
                              errors={errors}
                              key={index}
                              member={member}
                              handleChange={handleChange}
                              index={index}
                              setFieldValue={setFieldValue}
                              handleBlur={handleBlur}
                              remove={remove}
                            />
                          ))}
                          <div className="pb-8">
                            <Button
                              className="flex w-full justify-center mb-5 rounded-lg bg-[#B3CEE1] bg-opacity-20 p-4"
                              onClick={() => handleAddAnotherUser({ validateForm, push, setTouched })}
                            >
                              + Add {values.members?.length ? 'another' : ''}  member
                            </Button>
                          </div>
                        </div>
                      )}
                    </FieldArray>
                    <div className="flex justify-end text-right p-8">
                      <Button
                        className="bg-[#1A4895] text-white rounded-lg py-3 flex-inline px-10 font-bold"
                        onClick={submitForm}
                        type='primary'
                        disabled={loading}
                      >
                        {loading ? <Loader /> : 'Send Invite'}
                      </Button>
                    </div>
                  </>
                )}
                </Formik>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
};

export default Invite;

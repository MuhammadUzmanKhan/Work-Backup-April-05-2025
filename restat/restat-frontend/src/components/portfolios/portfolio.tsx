import React from "react";
import "../index.scss";
import { Formik, FieldArray } from "formik";
import {
  codeTextSnippetsValidationSchema,
  portfoliosValidationSchema,
} from "../../services/utils/validation-schemas";
import { CustomInjection, apis, useLoader } from "../../services";
import Loader from "../loader";
import {
  AddAnotherLinkProps,
  ErrorProps,
  PortfolioObject,
  PortfolioProps,
  PortfolioValues,
  UpdatePortfolioProps,
} from "../../services/types/common";
import FormContent from "./form-content";
import GetTags from "../tags";
import { PORTFOLIO_TYPE } from "../../services/types/portfolio_types";
import { convertDateFormat } from "../../services/utils/convertDate";
import { Button, Popconfirm } from "antd";
import { customNotification } from "..";
import { CloseOutlined, CopyOutlined } from "@ant-design/icons";
import moment from "moment";
import cleanAndTrimWhitespace from "../../services/utils/trimSpaces";

const Portfolio = React.memo(
  ({
    title,
    showLinks,
    type,
    showModal,
    closeModal,
    portfolio,
    fetchData,
  }: {
    title: string;
    showLinks: boolean;
    type: PORTFOLIO_TYPE;
    showModal: boolean;
    openModal: any;
    closeModal: any;
    portfolio?: PortfolioObject;
    fetchData?: () => void
  }) => {
    const { on, off, loading } = useLoader();
    let date = convertDateFormat(moment().format());
    if (portfolio) {
      date = convertDateFormat(portfolio.createdAt)
    }

    const initialValues = showLinks
      ? {
        name: portfolio ? portfolio.name : "",
        description: portfolio ? portfolio.description : "",
        links: portfolio
          ? portfolio?.links.map((link) => ({
            title: link.title,
            url: link.url,
          }))
          : [
            {
              title: "",
              url: "",
            },
          ],
        selectedTags: portfolio
          ? portfolio?.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            source: tag.source,
          }))
          : [],
      }
      : {
        name: portfolio ? portfolio.name : "",
        description: portfolio ? portfolio.description : "",
        selectedTags: portfolio
          ? portfolio?.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            source: tag.source,
          }))
          : [],
      };

    const closeTheModal = () => {
      closeModal()
      // setDuplicateUrlsError(undefined)
    }

    const handleAddAnotherLink = async ({
      validateForm,
      push,
      setTouched,
    }: AddAnotherLinkProps) => {
      const errors = await validateForm();
      setTouched(errors);
      if (Object.keys(errors).length === 0) {
        push({ title: "", url: "" });
      }
    };

    const validateTheUrls = (formikError: any, links: any) => {
      if (links) {
        const duplicateUrls: Set<string> = new Set();

        for (let i = 0; i < links.length; i++) {
          const currentUrl = links[i].url;
          if (duplicateUrls.has(currentUrl)) {
            formikError.push({ url: "Duplicate URL" });
          } else {
            formikError.push({})
            duplicateUrls.add(currentUrl);
          }
        }
      }
    }

    const handleSubmit = async (
      values: PortfolioValues,
      { setErrors }: { setErrors: any }
    ) => {
      let { name, description, links, selectedTags } = values;
      name = cleanAndTrimWhitespace(name);
      description = cleanAndTrimWhitespace(description);
      links = links?.map((link: any) => {
        return {
          title: cleanAndTrimWhitespace(link.title),
          url: cleanAndTrimWhitespace(link.url),
        };
      });

      const portfolioToCreate: PortfolioProps = { name, type, description };

      if (!selectedTags || selectedTags.length === 0) {
        setErrors({ selectedTags: "At least one tag must be selected" });
        return;
      }

      if (links) {
        portfolioToCreate.links = links;
      }

      if (selectedTags?.length) {
        portfolioToCreate.tags = selectedTags;
      }

      let formikError: ErrorProps[] = [];
      validateTheUrls(formikError, links)

      if (formikError.every((error) => Object.keys(error).length === 0)) {
        formikError = []
        if (portfolio) {
          const formValuesChanged = (
            name !== initialValues.name ||
            description !== initialValues.description ||
            JSON.stringify(links) !== JSON.stringify(initialValues.links) ||
            JSON.stringify(selectedTags) !== JSON.stringify(initialValues.selectedTags)
          );

          if (!formValuesChanged) {
            // Show a customNotification message and return, indicating that nothing has changed
            customNotification.warning("Alert!", "Update operation cannot be performed as nothing has changed");
            closeModal()
            return;
          }
          const portfolioToUpdate: UpdatePortfolioProps = {}
          portfolioToUpdate.id = portfolio.id;
          if (name !== initialValues.name) {
            portfolioToUpdate.name = name
          }
          if (description !== initialValues.description) {
            portfolioToUpdate.description = description
          }
          if (JSON.stringify(links) !== JSON.stringify(initialValues.links)) {
            portfolioToUpdate.links = links;
          }
          if (JSON.stringify(selectedTags) !== JSON.stringify(initialValues.selectedTags)) {
            portfolioToUpdate.tags = selectedTags
          }
          try {
            on();
            await apis.updatePortfolio(portfolioToUpdate);
            customNotification.success("Success!", `${title} updated successfully!`);
            fetchData && fetchData()
            closeModal();
          } catch (error: any) {
            if (error?.response?.status === 401) {
              customNotification.error(error?.response?.data?.message || `You are not authorized to update this ${title}.`)
            }
            else if (error?.response?.status === 404) {
              customNotification.error(error?.response?.data?.message || `${title} not found!`);
              return;
            }
            else if (error?.response?.status === 409) {
              const urlsAlreadyExist: Set<string> = new Set();
              error?.response?.data?.message?.forEach((link: any) => {
                urlsAlreadyExist.add(link.url)
              });
              links?.forEach(l => {
                if (urlsAlreadyExist.has(l.url)) {
                  formikError.push({ url: "URL already exists!" });
                }
                else {
                  formikError.push({});
                }
              })
            } else {
              customNotification.error(error?.response?.data?.message || `Something went wrong while updating the ${title}`);
            }
            setErrors({ links: formikError });
          } finally {
            off();
          }
        }
        else {
          try {
            on();
            await apis.createPortfolio(portfolioToCreate);
            customNotification.success("Success!", `${title} created successfully!`);
            fetchData && fetchData()
            closeModal();
          } catch (error: any) {
            if (error?.response?.status === 401) {
              customNotification.error(error?.response?.data?.message || `You are not authorized to create the ${title}.`)
            }
            else if (error?.response?.status === 409) {
              if (error?.response?.data?.message) {
                customNotification.error(error?.response?.data?.message || `${title} already exists!`);
                return;
              }
              const urlsAlreadyExist: Set<string> = new Set();
              error?.response?.data?.message?.forEach((link: any) => {
                urlsAlreadyExist.add(link.url)
              });
              links?.forEach(l => {
                if (urlsAlreadyExist.has(l.url)) {
                  formikError.push({ url: "URL already exists!" });
                }
                else {
                  formikError.push({});
                }
              })
            } else {
              customNotification.error(error?.response?.data?.message || `Error occurred in creating ${title}. Please try again later.`);
            }
            setErrors({ links: formikError });
          } finally { off() }
        }
      } else {
        setErrors({ links: formikError });
      }
    };

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        customNotification.info("Done!", 'Text copied to clipboard!', 1);
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
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
              <div className="relative w-full max-w-5xl max-h-full">
                <div className="relative bg-white rounded-lg shadow">
                  <div className="header-modal flex items-center justify-between px-6 py-2 border-b rounded-t">
                    <div className="title-modal flex items-center bg-white rounded-lg px-4 py-1 min-h-[1.5rem]">
                      <Button type="link">Portfolios</Button>
                      <span className="mx-2"> &gt; </span>
                      <Button type="link">{title}</Button>
                    </div>
                    <div className="flex actionBtns">
                      <button
                        type="button"
                        className="text-gray-400 bg-white btn-in border rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
                        data-modal-hide="defaultModal"
                        onClick={closeTheModal}
                      >
                        <CloseOutlined />
                      </button>
                    </div>
                  </div>
                  <div className="border-b border-b-[#b3cee19e] p-4 md-heading flex items-center justify-between">
                    <h2 className="text-[1.375rem]">Create {title}</h2>
                    <div className="created-date">
                      <p>
                        <strong className="font-medium">Created:</strong>
                      </p>
                      <p>{date}</p>
                    </div>
                  </div>
                  <Formik
                    initialValues={initialValues}
                    validationSchema={
                      showLinks
                        ? portfoliosValidationSchema
                        : codeTextSnippetsValidationSchema
                    }
                    onSubmit={handleSubmit}
                  >
                    {({
                      values,
                      handleChange,
                      submitForm,
                      validateForm,
                      handleBlur,
                      errors,
                      touched,
                      setTouched,
                    }) => (
                      <>
                        <div className="modal-in-card border border-[#b3cee19e] p-4 rounded-lg">
                          <input
                            type="text"
                            id="name"
                            className="custom-input outline-0 bg-white border border-[#b3cee19e] text-gray-900 text-sm rounded-lg block w-full p-4 h-[3rem]"
                            placeholder={`Enter ${title} Name`}
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <div className="mb-4">
                            {errors?.name && touched?.name && (
                              <div className="error">
                                <div className="error">
                                  {touched?.name && errors?.name}
                                </div>
                              </div>
                            )}
                          </div>
                          <textarea
                            id="description"
                            className="custom-input outline-0 bg-white border border-[#b3cee19e] text-gray-900 text-sm rounded-lg block w-full p-4 h-[8rem]"
                            placeholder={`${title} description...`}
                            name="description"
                            value={values.description}
                            maxLength={5000}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <div className="error-and-word-count">
                            <div className="error-div">
                              {errors?.description && touched?.description && (
                                <div className="error">
                                  <div className="error">
                                    {touched?.description &&
                                      errors?.description}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="word-count">
                              {values.description?.length}/5000
                            </div>
                          </div>

                          {type === PORTFOLIO_TYPE.TEMPLATE && <div className="templates-injection">
                            <h3>Placeholders:</h3>
                            <p><b>Note:</b> Copy and paste these placeholders at the appropriate locations of your choice in description</p>
                            <ul>
                              <li><b onClick={() => copyToClipboard(CustomInjection.PROJECT)} title="Copy">{CustomInjection.PROJECT} <CopyOutlined /> </b> <span>Selected projects will be inserted in place of this placeholder. </span> </li>
                              <li><b onClick={() => copyToClipboard(CustomInjection.CASE_STUDY)} title="Copy">{CustomInjection.CASE_STUDY} <CopyOutlined /> </b> <span>Selected case studies will be inserted in place of this placeholder.</span> </li>
                              <li><b onClick={() => copyToClipboard(CustomInjection.LINK)} title="Copy">{CustomInjection.LINK} <CopyOutlined /> </b> <span>Selected links will be inserted in place of this placeholder.</span> </li>
                            </ul>
                          </div>}


                          {showLinks && (
                            <div className="border max-w-[52rem] border-[#b3cee19e] p-4 rounded-lg">
                              <FieldArray name="links">
                                {({ push, remove }) => (
                                  <div className="p-2  max-w-[50rem] max-h-[10rem] overflow-y-auto">
                                    {values?.links?.map((link, index) => {
                                      return (
                                        <FormContent
                                          touched={touched}
                                          errors={errors}
                                          key={index}
                                          link={link}
                                          handleChange={handleChange}
                                          index={index}
                                          handleBlur={handleBlur}
                                          removeLink={remove}
                                        />
                                      );
                                    })}
                                    <button
                                      className="flex w-[93%] justify-center mb-5 rounded-lg bg-[#B3CEE1] bg-opacity-20 p-4"
                                      onClick={() =>
                                        handleAddAnotherLink({
                                          validateForm,
                                          push,
                                          setTouched,
                                        })
                                      }
                                    >
                                      + Add another Link
                                    </button>
                                  </div>
                                )}
                              </FieldArray>
                            </div>
                          )}
                          <GetTags values={values} errors={errors} />
                        </div>

                        <div className="flex justify-end text-right p-5">
                          <Popconfirm
                            title="Update the Proposal"
                            description="Please note that you are going to update the information so we need a confirmation!"
                            okText="Confirm"
                            okButtonProps={{ style: { backgroundColor: "#1A4895", color: "white" } }}
                            cancelText="Cancel"
                            onConfirm={submitForm}
                          >
                            <Button danger key="save" type="primary" style={{ backgroundColor: "#1A4895", marginLeft: "10px" }} disabled={loading}>
                              {loading ? <Loader /> : portfolio ? `Update ${title}` : `Create ${title}`}
                            </Button>
                          </Popconfirm>
                        </div>
                      </>
                    )}
                  </Formik>
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

export default Portfolio;

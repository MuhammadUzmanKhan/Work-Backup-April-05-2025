import { CloseOutlined, UploadOutlined } from "@ant-design/icons";
import { UploadProps, Button, Upload, Table } from "antd";
import Dragger from "antd/es/upload/Dragger";
import * as XLSX from "xlsx";
import { useState } from "react";
import customNotification from "../notification";
import { getUploadTable } from "../../services/constants/upload-table";
import { Portfolio } from "../../services/types/common";
import { apis } from "../../services";
import { PORTFOLIO_TYPE } from "../../services/types/portfolio_types";

const UploadFile = ({
  type,
  title,
  showModal,
  closeModal,
  openModal,
}: {
  type: string;
  title: string;
  showModal: boolean;
  closeModal: () => void;
  openModal: () => void;
}) => {
  const [data, setData] = useState<Portfolio[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const props: UploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    accept: ".xls,.xlsx",
    action: undefined,
    beforeUpload: (file) => {
      const isExcel =
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";
      if (!isExcel) {
        customNotification.error(
          `${file.name} is not a valid Excel file. Please upload a valid .xls or .xlsx file.`
        );
        return Upload.LIST_IGNORE;
      }
      return isExcel;
    },
    onChange(info) {
      const { originFileObj } = info.file;
      if (originFileObj) {
        handleExcelUpload(originFileObj);
        setFileToUpload(originFileObj);
      }
    },
    onDrop(e) {
      console.error("Dropped files", e.dataTransfer.files);
    },
  };

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      const validateRow = (row: any, index: number): boolean => {

        let isValid = true;
        const urlRegex = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;


        if (!row?.name) {
          setError('Name is required for all portfolios.');
          isValid = false;
        }
        if (!row?.description) {
          setError('Description is required for all portfolios.');
          isValid = false;
        }
        if (!row?.type || !Object.values(PORTFOLIO_TYPE).includes(row?.type)) {
          setError('Invalid portfolio type.');
          isValid = false;
        }
        if (row?.tags && typeof row?.tags !== "string") {
          setError('Tags should be a comma-separated string.');
          isValid = false;
        }
        // Validate links (optional fields)
        if (row?.urlTitle1 && row?.url1) {
          if (!urlRegex.test(row?.url1)) {
            setError('Invalid URL format for URL');
            isValid = false;
          }
        }
        return isValid;
      }

      const mappedData: Portfolio[] = (jsonData as any[]).map((row: any) => {
        validateRow(row, jsonData.indexOf(row));

        const links = [
          row?.urlTitle1 && row?.url1 ? { title: row.urlTitle1, url: row.url1 } : undefined,
          row?.urlTitle2 && row?.url2 ? { title: row.urlTitle2, url: row.url2 } : undefined,
          row?.urlTitle3 && row?.url3 ? { title: row.urlTitle3, url: row.url3 } : undefined,
        ].filter(link => link !== undefined);

        return {
          name: row?.name,
          description: row?.description as string,
          type: row?.type as PORTFOLIO_TYPE,
          links: links as { title: string; url: string; }[],
          tags: row?.tags ? row.tags.split(",") : [],
        };
      });
      setData(mappedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadFile = async () => {
    if (!fileToUpload && data.length === 0) {
      customNotification.error("No file selected for upload.");
      return;
    }

    if (error) {
      customNotification.error("Please fix the errors before uploading the file.", error);
      return
    }

    try {
      setLoading(true);
      await apis.bulkCreatePortfolios(data);
      customNotification.success("File uploaded successfully.");
      setLoading(false);
      handleCancelUpload();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      customNotification.error("An error occurred while uploading file.", error?.response?.data?.message);
      setLoading(false);
    }

  };

  const handleCancelUpload = () => {
    setFileToUpload(null);
    setData([]);
  };

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ["name", "description", "type", "urlTitle1", "url1", "urlTitle2", "url2", "urlTitle3", "url3", "tags"],
      [
        "Sample Proj Name",
        "Sample Description",
        "PROJECT",
        "Title 1",
        "http://example.com",
        "Title 2",
        "",
        "",
        "",
        "tag1,tag2",
      ],
      [
        "Sample Case",
        "Sample Description",
        "CASE_STUDY",
        "Title 2.1",
        "http://example.com",
        "Title 2.2",
        "",
        "",
        "",
        "tag1,tag2",
      ],
      [
        "Sample Link",
        "Sample Description",
        "LINK",
        "Title 3.1",
        "http://example.com",
        "Title 2.3",
        "",
        "",
        "",
        "tag1,tag2",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["E2"].l = { Target: "http://example.com" };
    worksheet["E3"].l = { Target: "http://example.com" };
    worksheet["E4"].l = { Target: "http://example.com" };

    //  widths for better visibility
    worksheet["!cols"] = [
      { width: 20 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 40 },
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 20 },
      { width: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    XLSX.writeFile(workbook, "portfolio-template.xlsx");
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  return (
    <div>
      {showModal && (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-full max-w-5xl max-h-full">
              <div className="relative bg-white rounded-lg shadow">
                <div className="header-modal flex items-center justify-between px-6 py-2 border-b rounded-t">
                  <div className="title-modal flex items-center bg-white rounded-lg px-4 py-1 min-h-[1.5rem]">
                    <button>Portfolio Management</button>
                    <span className="mx-2"> &gt; </span>
                    <button>{title}</button>
                  </div>
                  <div className="flex actionBtns">
                    <button
                      type="button"
                      className="text-gray-400 bg-white btn-in border rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
                      data-modal-hide="defaultModal"
                      onClick={closeModal}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="mt-4 flex justify-end pb-3 gap-2">
                    <Button
                      key="download"
                      type="primary"
                      className="bg-[#1A4895] text-white border-0 hover:bg-[#1a6696]"
                      onClick={downloadTemplate}
                    >
                      Download Template
                    </Button>
                  </div>

                  {(data.length === 0 || fileToUpload === null) && (
                    <Dragger {...props}>
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                      </p>
                      <p className="ant-upload-text">
                        Click or drag your Excel file to this area to upload
                      </p>
                      <p className="ant-upload-hint">
                        Only single Excel files (.xls, .xlsx) are supported.
                        Please use the template for correct data formatting.
                      </p>
                    </Dragger>
                  )}

                  {data.length > 0 && (
                    <Table
                      columns={getUploadTable(currentPage, pageSize)}
                      dataSource={data}
                      className="mt-4"
                      pagination={{
                        current: currentPage,
                        pageSize,
                        onChange: handleTableChange,
                      }}
                      size="large"
                      loading={loading}
                    />
                  )}

                  <div className="mt-4 flex justify-end pb-3 gap-2">
                    {data.length > 0 && (<Button
                      key="cancel"
                      type="primary"
                      danger
                      onClick={handleCancelUpload}
                    >
                      Cancel
                    </Button>
                    )}
                    <Button
                      key="upload"
                      type="primary"
                      className="bg-[#1A4895] text-white border-0 hover:bg-[#1a6696]"
                      onClick={uploadFile}
                    >
                      Upload Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black" />
        </>
      )}
    </div>
  );
};

export default UploadFile;

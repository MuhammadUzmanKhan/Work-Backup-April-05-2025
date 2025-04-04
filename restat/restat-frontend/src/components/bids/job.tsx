import React, { useState } from "react";
import { Typography, Divider, Tag } from "antd";
import { images } from "../../assets";
import { BidDetails, Job as IJob } from "../../services/types/bids";
import { ROLE } from "../../services/types/common";
import { convertDateFormat } from "../../services/utils/convertDate";

const Job = React.memo(
  ({
    bidDetails,
    updateValue,
    role,
  }: {
    bidDetails: BidDetails;
    updateValue: (key: keyof IJob, value: string | number | boolean) => void;
    role: string;
  }) => {
    const jobDate = bidDetails?.job?.postedDate;
    const [editableFields, setEditableFields] = useState<any>({
      experienceLevel: bidDetails?.job?.experienceLevel?.replace(",", ""),
      hourlyRange: bidDetails?.job?.hourlyRange,
      hourly: bidDetails?.job?.hourly,
      projectLength: bidDetails?.job?.projectLength
        ? bidDetails.job.projectLength.split(" ").slice(-2).join(" ")
        : "",
    });

    const stripHtmlTags = (html: string) => {
      return html.replace(
        /<br\s*\/?>|<p[^>]*>|<\/p>|<span[^>]*>|<\/span>|<button[^>]*>[\s\S]*?<\/button>/gi,
        ""
      );
    };

    const parseJobDescription = (description: string) => {
      return description.replace(/\n/g, "<br>");
    };

    const description = stripHtmlTags(bidDetails?.job?.description || "");

    return (
      <div className="job-details p-4">
        <div className="header flex justify-between items-center mb-4">
          <Typography.Title level={4} className="m-0">
            Job Details
          </Typography.Title>
          <div className="flex items-center">
            <a
              href={bidDetails?.job?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ant-btn ant-btn-link d-flex"
            >
              <Typography.Text className="text-gray-500 pr-3">
                View Job Post
              </Typography.Text>
              <img width={20} src={images.pointingArrow2} alt="pointer" />
            </a>
          </div>
        </div>

        <Typography.Title level={5} className="mt-2">
          {bidDetails?.job?.title}
        </Typography.Title>

        {jobDate && (
          <div className="flex items-center mt-2 text-gray-500">
            <div className="small-grey-box" />
            <Typography.Text className="ml-2">Posted:</Typography.Text>
            <Typography.Text className="ml-2">
              {convertDateFormat(jobDate)}
            </Typography.Text>
          </div>
        )}

        <Divider className="my-4" />

        <div className="description-container mt-4 p-4 border border-gray-300 rounded bg-gray-50">
          <Typography.Paragraph
            className="text-gray-500"
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: "30rem",
              overflowY: "auto",
            }}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: parseJobDescription(description),
              }}
            />
          </Typography.Paragraph>
        </div>

        <Divider className="my-4" />

        <div className="details-grid grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries({
            ExperienceLevel: "experienceLevel",
            HourlyRange: "hourlyRange",
            Hourly: "hourly",
            ProjectLength: "projectLength",
          }).map(([label, key]) => (
            <div key={key} className="flex flex-row">
              <Typography.Text className="text-gray-600">
                {label}
              </Typography.Text>
              {
                <Typography.Text
                  editable={
                    role === ROLE.COMPANY_ADMIN
                      ? {
                        onChange: (value) => {
                          updateValue(key as keyof IJob, value);
                          setEditableFields({
                            ...editableFields,
                            [key]: value,
                          });
                        },
                      }
                      : false
                  }
                  className="text-gray-400 mt-1"
                >
                  {editableFields[key] ? editableFields[key] : "N/A"}
                </Typography.Text>
              }
            </div>
          ))}
        </div>

        <Typography.Title level={5} className="mt-4">
          Skills Set
        </Typography.Title>
        <div className="tags-container mt-2 flex flex-wrap gap-2">
          {bidDetails?.job.jobsTags?.map((tag, index) => (
            <Tag key={index} className="text-gray-500">
              {tag.tags?.name}
            </Tag>
          ))}
        </div>
      </div>
    );
  }
);

export default Job;

import React from "react";
import { AddLinksProps } from "../../services/types/common";
// import {images} from "../../assets"
import { Trash } from "../../assets/images/svg-react-component";
import "../index.scss";
const FormContent = React.memo(({
  touched,
  link,
  handleChange,
  index,
  errors,
  handleBlur,
  removeLink,
}: AddLinksProps) => {
  return (
    <div className="relative flex space-x-4">
      {" "}
      {/* Wrap inputs in a flex container */}
      <div className="flex-grow">
        <input
          type="text"
          id="title"
          className="custom-input outline-0 bg-white border border-[#b3cee19e] text-gray-900 text-sm rounded-lg block w-full p-4 h-[3rem]"
          placeholder="Title"
          name={`links.${index}.title`}
          value={link.title}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <div className="error mb-4">
          {errors.links?.length > index && (
            <div className="error">
              {touched?.links?.length &&
                touched.links?.length > 0 &&
                touched?.links[index]?.title &&
                errors?.links[index]?.title}
            </div>
          )}
        </div>
      </div>
      <div className="flex-grow">
        <input
          type="text"
          id="url"
          className="custom-input outline-0 bg-white border border-[#b3cee19e] text-gray-900 text-sm rounded-lg block w-full p-4 h-[3rem]"
          placeholder="Enter URL"
          name={`links.${index}.url`}
          value={link.url}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <div className="error mb-4">
          {errors.links?.length > index && (
            <div className="error">
              {touched?.links?.length &&
                touched.links?.length > 0 &&
                touched?.links[index]?.url &&
                errors?.links[index]?.url}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className={`p-1 ${touched.links?.length > 0 && errors.links?.length > index ? 'mb-10' : 'mb-4'} text-gray-400 hover:text-red-500 focus:outline-none`}
        onClick={() => removeLink(index)}
      >
        <Trash className="trash-icon" fillColor={'grey'}/>
      </button>
    </div>
  );
})

export default FormContent;

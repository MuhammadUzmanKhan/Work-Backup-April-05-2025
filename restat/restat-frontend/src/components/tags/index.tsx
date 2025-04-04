import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import { Tags, TagsProps } from "../../services/types/common";
import { images } from "../../assets";
import "../index.scss";
import Loader from "../loader";
import { FieldArray } from "formik";
import { debounce } from "../../services/utils/debounce";
import { apis } from "../../services";
import { customNotification } from "..";


const GetTags = React.memo(({ values, errors }: TagsProps) => {
  const [search, setSearch] = useState<string>("");
  const [searchBox, setSearchBox] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<Tags[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useMemo(() => {
    return debounce((query: string) => {
      if (query.length >= 2) {
        fetchTags(query);
      }
    }, 300);
  }, []);

  const onChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchBox(true);
    const query = e.target.value.trim();
    setSearch(query);
  };

  const fetchTags = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await apis.getAllTags(query);
      if (response) {
        const tags = await response.data?.tags;
        setSearchResult(tags);
      } else {
        throw new Error("Failed to fetch tags");
      }
    } catch (error: any) {
      console.error("Error fetching tags:", error);
      if (error?.response?.data?.message) {
        customNotification.error(error?.response?.data?.message);
      } else {
        customNotification.error("An Error Occurred! In fetching tags");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = async (push: (tag: any) => void) => {
    try {
      const resp = await apis.createTags([search])
      push(resp?.data?.tags[0])
      customNotification.success(`"${search}" tag is created successfully!`)
    } catch (err) {
      customNotification.error("Something went wrong while creating the tag!")
    } finally {
      setSearchBox(false);
    }
  };

  const truncate = (data: string) => {
    if (data?.length > 5) {
      return data.split("").slice(0, -4).join("") + " ...";
    }
    return data;
  };

  useEffect(() => {
    if (search) {
      debouncedSearch(search);
    } else {
      setSearchResult([]);
      setSearchBox(false);
    }
  }, [search]);

  useEffect(() => {
    setIsLoading(true);
    setSearchResult([]);
    setIsLoading(false);
  }, []);

  return (
    <div className="mt-5">
      <h2 className="mb-2 font-medium">Tags</h2>
      <div>Search and add tags to provide more detailed subject information.</div>
      <div className="mb-3 max-w-[47rem] forms-group">
        <input
          className="custom-input mt-3 outline-0 bg-white border border-[#b3cee19e] text-gray-900 text-sm rounded-lg block w-full p-4 h-[3rem]"
          placeholder="Choose Tags here"
          onChange={onChangeSearch}
        />
        <img src={images.searchIcon} alt="" className="seacrh-icon" />
      </div>
      <div className="mb-4">
        {!values?.selectedTags?.length && errors?.selectedTags && (
          <div className="error">
            <div className="error">{errors?.selectedTags}</div>
          </div>
        )}
      </div>
      <FieldArray name="selectedTags">
        {({ push, remove }) =>
          <div>
            {search.length >= 2 && searchBox && (
              <div
                className="search-box bg-white border border-[#b3cee19e] text-sm rounded-lg w-[calc(97%)]"
                style={{ maxHeight: "9rem", overflow: "scroll" }}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-full m-2">
                    <Loader />
                  </div>
                ) : (
                  <div className="pt-3 cursor-pointer">
                    <div>
                      <div
                        className="pl-2 p-0.5 cursor-pointer"
                        onClick={() => addTag(push)}
                      >
                        Add "{search}"
                      </div>
                      {searchResult.map((tag) => (
                        <div
                          key={tag.id}
                          className="pl-2 p-0.5 rounded-lg text-gray-900"
                          onClick={() => {
                            if (
                              !values?.selectedTags?.some(
                                (selectedTag) => selectedTag.name == tag.name
                              )
                            ) {
                              push(tag);
                            }
                            setSearchBox(false);
                          }}
                        >
                          {tag.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 tags-container text-gray-500">
              {values?.selectedTags?.map((tag: any, index: number) => {
                return (
                  <div key={index} className="tagsTag">
                    <span className="selectedTagsTag">{tag.name}</span>
                    <span className="selectedTagsTagHover">
                      {truncate(tag.name)}
                      <i onClick={() => remove(index)}>X</i>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        }
      </FieldArray>
    </div>
  );
});

export default GetTags;

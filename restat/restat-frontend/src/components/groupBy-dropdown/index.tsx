import { useState } from "react";
import "./index.scss";
import { images } from "../../assets";
import { ROLE, UsersObject } from "../../services/types/common";
import { GroupBy } from "../../services/types/general";
import { customNotification } from "..";
const GroupByDropdown = ({
  user,
  value,
  options,
  bidders,
  onClear,
  profiles,
  onChange,
  forceShowBidders,
  handleChangeBidder,
  handleChangeProfile,
}: {
  user: UsersObject;
  options: any[];
  onChange: (option: any) => void;
  handleChangeProfile?: (option: any) => void;
  handleChangeBidder?: (option: any) => void;
  value: any;
  bidders?: any[];
  profiles?: any[];
  forceShowBidders?: boolean;
  onClear?: () => void
}) => {
  const [showGroupByDiv, setShowGroupByDiv] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(-1);

  const optionClicked = (option: any, index: number) => {
    if (index === 0) {
      setShowGroupByDiv(false);
      onClear && onClear()
    } else if (index === selectedOptionIndex) {
      setShowGroupByDiv(false);
      setSelectedOptionIndex(-1);
    } else {
      setShowGroupByDiv(true);
      setSelectedOptionIndex(index);
      if (option === GroupBy.Profile && profiles && profiles.length === 0) {
        customNotification.error("Error!", "No Upwork Profile Exists!")
      } else if (option === GroupBy.Bidder && bidders && bidders.length === 0) {
        customNotification.error("Error!", "No Business Developer Exists!")
      }
    }
  };

  const subOptionClicked = (entity: any, option: string) => {
    if (option === GroupBy.Profile) {
      handleChangeProfile && handleChangeProfile(entity);
    } else if (option === GroupBy.Bidder) {
      handleChangeBidder && handleChangeBidder(entity);
    }
    onChange(entity.name);
    setShowGroupByDiv(false);
    setSelectedOptionIndex(-1);
  };

  return (
    <>
      <div className="pointer flex items-center">
        <div className="mr-3 text-gray-800 font-semibold">Group By: </div>
        <div className="custom-select-groupby text-gray-800">
          <div
            className="flex justify-between"
            onClick={() => setShowGroupByDiv(!showGroupByDiv)}
          >
            <div className="flex">
              <span className="">{value}</span>
            </div>
            <div className="flex">
              <img src={images.down_arrow} />
            </div>
          </div>
          {showGroupByDiv && (
            <div className="custom-select-options-groupby text-gray-800">
              {options.map((option: any, index: number) => (
                <div
                  key={index}
                  onClick={() => optionClicked(option, index)}
                  className={`flex custom-select-option-groupby justify-between ${selectedOptionIndex === index ? "active" : ""
                    }`}
                >
                  {option === 'Select Option' && value !== 'Select Option' ? <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Clear</span> : option}
                  {index !== 0 && (
                    <div className="flex justify-end items-center">
                      <img src={images.down_arrow} />
                    </div>
                  )}
                  {index === selectedOptionIndex &&
                    profiles &&
                    profiles.length > 0 &&
                    bidders &&
                    bidders.length > 0 ? (
                    <div className="nested-dropdown">
                      {option === GroupBy.Profile && (
                        <div className="custom-select-profiles-groupby min-h-[8rem]">
                          {profiles.map((profile: any, i: number) => (
                            <div
                              key={i}
                              onClick={() =>
                                subOptionClicked(profile, option)
                              }
                              className="flex custom-select-profile-groupby justify-between"
                            >
                              {profile.name}
                            </div>
                          ))}
                        </div>
                      )}
                      {option === GroupBy.Bidder &&
                        ((user?.role === ROLE.COMPANY_ADMIN || user?.role === ROLE.OWNER) || forceShowBidders) && (
                          <div className="custom-select-bidders-groupby min-h-[8rem]">
                            {bidders.map((bidder: any, i: number) => (
                              <div
                                key={i}
                                onClick={() =>
                                  subOptionClicked(bidder, option)
                                }
                                className="flex custom-select-bidder-groupby justify-between"
                              >
                                {bidder.name}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ) : index === selectedOptionIndex &&
                    profiles &&
                    profiles.length > 0 ? (
                    <div className="nested-dropdown">
                      {option === GroupBy.Profile && (
                        <div className="custom-select-profiles-groupby min-h-[8rem]">
                          {profiles.map((profile: any, i: number) => (
                            <div
                              key={i}
                              onClick={() =>
                                subOptionClicked(profile, option)
                              }
                              className="flex custom-select-profile-groupby justify-between"
                            >
                              {profile.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : index === selectedOptionIndex &&
                  bidders &&
                  bidders.length > 0 && (
                    <div className="nested-dropdown">
                      {option === GroupBy.Bidder &&
                        ((user?.role === ROLE.COMPANY_ADMIN || user?.role === ROLE.OWNER) || forceShowBidders) && (
                          <div className="custom-select-bidders-groupby min-h-[8rem]">
                            {bidders.map((bidder: any, i: number) => (
                              <div
                                key={i}
                                onClick={() =>
                                  subOptionClicked(bidder, option)
                                }
                                className="flex custom-select-bidder-groupby justify-between"
                              >
                                {bidder.name}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupByDropdown;

export const formattedDate = (date: any = '') => {
  date ? date = new Date(date) : date = new Date
  // const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

export const formattedDateAndTime = (date: any = '') => {
  date ? date = new Date(date) : date = new Date();
  
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    // second: "numeric",
    // timeZoneName: "short" // To include the timezone in the output
  };
  
  return new Intl.DateTimeFormat("en-US", options).format(date);
};
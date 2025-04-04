import { ReactNode } from "react";

interface PageWrapperProps {

  children: ReactNode;

}



const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {

  return <div className="h-[calc(100vh-7.25rem)] p-4 overflow-y-auto">
    {children}
  </div>;

};

export default PageWrapper;
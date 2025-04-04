import { FiCode } from "react-icons/fi";

const QRCodeIcon = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex items-center justify-center h-32 w-32 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center h-20 w-20 bg-blue-500 rounded-md shadow-md">
          <FiCode className="text-4xl text-white" />
        </div>
      </div>
    </div>
  );
};

export default QRCodeIcon;

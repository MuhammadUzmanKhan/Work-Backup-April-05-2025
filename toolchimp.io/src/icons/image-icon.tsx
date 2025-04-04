import { FiCamera } from "react-icons/fi";

const ImageIcon = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex items-center justify-center h-32 w-32 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center h-20 w-20 bg-green-500 rounded-md shadow-md">
          <FiCamera className="text-4xl text-white" />
        </div>
      </div>
    </div>
  );
};

export default ImageIcon;

import unauthorized from "@public/unauthorized.png";
import Image from "next/image";
const Unauthorized: React.FC = () => {
    return (
        <div className="h-full w-full bg-white flex flex-col justify-center items-center" >
            <Image src={unauthorized} alt="unauthorized.png" className="h-[200px] w-[200px] object-cointain mb-8" />
            <h1 className="font-poppins text-2xl text-primary" >This Portal is for authorized personnel only</h1>
            <h3 className="font-poppins text-l text-primary">Please login using okta or contact your system admin</h3>
        </div>
    );
};

export default Unauthorized;

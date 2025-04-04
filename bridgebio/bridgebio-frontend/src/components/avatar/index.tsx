import Image from "next/image";
import avatar from '@public/avatar-placeholder.png';
import arrowDown from '@public/arrow-down.svg';

const Avatar: React.FC = () => {
    return (
        <div className="h-[40px] flex gap-3 rounded-lg items-center" >
            <Image src={avatar} alt="avatar-image" className="w-[40px] h-[40px] object-contain" />
            <Image src={arrowDown} alt="arrow-down" className="w-[10px]" />
        </div>
    );
};

export default Avatar;
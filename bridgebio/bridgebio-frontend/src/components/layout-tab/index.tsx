"use client";

import { images, LayoutTabProps } from "@/types";
import Image from "next/image";
import { useState } from "react";

const LayoutTab: React.FC<LayoutTabProps> = ({ label, image }) => {
    const [isHovered, setIsHovered] = useState(false);
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const getImage = (imageName: string) => {
        return isHovered ? images[imageName]?.light : images[imageName]?.dark;
    };

    return (
        <span
            className="rounded-lg bg-white/50 p-3 border border-lightBlue text-primary min-w-[40px] h-[40px] hover:bg-primary hover:text-white cursor-pointer flex justify-center items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {
                image ?
                    <Image src={getImage(image)} alt="tabImage" width={9} /> :
                    <p className="text-[12px]">{label}</p>
            }
        </span>
    );
};

export default LayoutTab;

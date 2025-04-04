import { MedicineCardProps } from "@/types";
import { useCallback } from "react";

const MedicineCard: React.FC<MedicineCardProps> = ({
    disease,
    therapy,
    handleClick,
    id
}) => {
    const click = useCallback(() => {
        handleClick(id);
    }, [id, handleClick]);

    return (
        <div className="bg-white rounded-lg p-7 flex cursor-pointer flex-row gap-5" onClick={() => click()} >
            <MedicineCardItem title="The Disease" value={disease} />
            <MedicineCardItem title="The Therapy" value={therapy} />
        </div >
    );
};

export default MedicineCard;

const MedicineCardItem: React.FC<{ title: string; value: string; }> = ({ title, value }) => {
    return (
        <div>
            <p className="text-ternary font-[400] text-[12px]" >{title}</p>
            <p className="text-primary font-[600] text-[20px]" >{value}</p>
        </div>
    );
};

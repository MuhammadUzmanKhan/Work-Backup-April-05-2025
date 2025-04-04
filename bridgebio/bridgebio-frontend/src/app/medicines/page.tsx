"use client";

import Image from "next/image";
import logo from '@public/logo-white.svg';
import medicineSelectionBackground from '@public/medicine-selection-background.png';
import bridgeBioLogo from '@public/bridge-bio-logo.svg';
import { useCallback, useEffect, useState } from "react";
import { apis } from "@/services";
import { MedicineProps } from "@/types";
import { ActivityLoader, MedicineCard } from "@/components";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

const Medicines: React.FC = () => {
    const [medicines, setMedicines] = useState<MedicineProps[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentCard, setCurrentCard] = useState<number>(0);
    const router = useRouter();
    const nextCard = useCallback(() => {
        if (currentCard < medicines.length - 1) {
            setCurrentCard(prev => prev + 1);
        }
    }, [currentCard, medicines.length]);
    const prevCard = useCallback(() => {
        if (currentCard > 0) {
            setCurrentCard(prev => prev - 1);
        }
    }, [currentCard]);
    const getMedicines = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apis.getMedicines();
            setMedicines(data);
        } catch (error) {
            toast.error((error as AxiosError).response?.statusText);
        }
        setLoading(false);
    }, []);
    const handleRedirect = useCallback((id: string) => {
        router.replace(`/${id}/home`);
    }, [router]);

    useEffect(() => {
        getMedicines();
    }, []);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-5 ">
            <Image alt="background" src={medicineSelectionBackground} className="h-full w-full absolute" objectFit="contain" />
            <div className="px-[100px] py-[20px] rounded-lg flex flex-col items-center backdrop-blur-md bg-black/20" >
                <Image src={logo} alt="Logo" width={200} objectFit="contain" className="mb-8 mt-10" />
                <h1 className="text-[30px] font-medium text-white mb-10" >Welcome to Strata</h1>
                {loading ? (
                    <ActivityLoader />
                ) : medicines.length === 0 ? (
                    <div className="p-5 rounded bg-white text-secondary" >No medicines available</div>
                ) : (
                    <div className="flex flex-row gap-5 items-center" >
                        {medicines.length > 1 && <div className="h-[40px] w-[40px] cursor-pointer rounded bg-secondary  flex justify-center items-center text-white" onClick={prevCard} >{'<'}</div>}
                        <MedicineCard disease={medicines?.[currentCard]?.disease} therapy={medicines?.[currentCard]?.therapy} handleClick={handleRedirect} id={medicines?.[currentCard]?.id} />
                        {medicines.length > 1 && <div className="h-[40px] w-[40px] cursor-pointer rounded bg-secondary flex justify-center items-center text-white" onClick={nextCard} >{'>'}</div>}
                    </div>
                )}
                <div className="flex flex-col items-center gap-2" >
                    <Image src={bridgeBioLogo} alt="bridgeBioLogo" className="w-[80px] mt-[100px]" />
                    <p className="text-[11px] text-white" >Help@Bridgebio.com</p>
                </div>
            </div>
        </div>
    );
};

export default Medicines;

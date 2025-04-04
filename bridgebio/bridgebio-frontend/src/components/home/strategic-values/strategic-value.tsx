import Image from "next/image";
import Box from '@public/box-svgrepo-com.svg';
import Jar from '@public/jar-of-pills-2-svgrepo-com.svg';
import Pill from '@public/pill-svgrepo-com.svg';
import Pills from '@public/pills-svgrepo-com.svg';

const cards = [
    {
        icon: <Image src={Pill} alt="" className="icon" />,
        title: <>Aligned <br /> Stakeholder Needs</>,
        description: <>Shared understanding and transparency of evidence requirements across stakeholders,<br /> including HCPs, payers, regulators, and patients.</>
    },
    {
        icon: <Image src={Pills} alt="" className="icon" />,
        title: <>Cross Functional<br />Alignment</>,
        description: <>Agreement on priority evidence gaps and solutions most critical to product success,<br /> across functions.</>
    },
    {
        icon: <Image src={Jar} alt="" className="icon" />,
        title: <>Increased<br />Efficiency</>,
        description: <>Identification of overlap in evidence generation activities and needs,<br /> which can be aligned and consolidated.</>
    },
    {
        icon: <Image src={Box} alt="" className="icon" />,
        title: <>Maximized<br />Impact of Data</>,
        description: <>Holistic evaluation of opportunities to leverage data to inform internal development decisions,<br /> and external stakeholder engagement.</>
    }
];

const StrategicValue = () => {
    return (
        <div className="flex flex-col justify-center items-center min-h-[100vh] p-[20px] ms-5">
            <div className="text-left w-[100%] max-w-[1000px]">
                <h1 className="text-[60px] text-primary font-[600] ">
                    Strategic Value of an Integrated <br /> Evidence Generation Plan
                </h1>
                <h2 className="text-[14px] font-[400] mb-[60px] text-black">
                    How Does an IEGP Add Value to an Organization?
                </h2>
                <div className="flex justify-between flex-wrap">
                    {cards.map((card, index) => (
                        <div key={index} className="w-[220px] p-[20px] bg-white rounded-[8px] border-[1px] shadow text-start backdrop-blur mb-3">
                            <div className="w-[50] h-[50]">{card.icon}</div>
                            <div className="flex flex-col justify-start pt-[50%]">
                                <h3 className="text-[20px] font-normal leading-[1.2] tracking[-0.05em] text-primary whitespace-nowrap max-h-[48px] overflow-ellipsis">{card.title}</h3>
                                <p className="text-[12px] font-normal leading-[1.2] tracking[-0.05em] text-secondary pt-[10%] overflow-ellipsis" >{card.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StrategicValue;

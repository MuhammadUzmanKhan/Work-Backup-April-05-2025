import bridgeBioLogo from '@public/bridge-bio-logo.svg';
import Image from 'next/image';

const Footer: React.FC = () => {
    return (
        <div className="px-7 py-4 bg-secondary flex justify-between items-center" >
            <Image src={bridgeBioLogo} alt='bridge-bio-logo' width={70} />
            <p className='text-[12px] text-white'>Powered by BridgeBio</p>
        </div>
    );
};

export default Footer;

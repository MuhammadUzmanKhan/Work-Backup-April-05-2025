import { PropsWithChildren } from 'react';
import NavigationBar from '../navigation';
import Footer from '../footer';

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <div
            className="w-screen h-screen bg-white flex flex-col"
        >
            <NavigationBar />
            <div className="overflow-auto grow">
                {children}
            </div>
            <Footer />
        </div>
    );
};

export default Layout;

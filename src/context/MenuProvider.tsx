import { createContext, useContext, useState, } from "react";


interface MenuContextType {
    menu: boolean | null;
    setMenu: (menu: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
    const [menu, setMenu] = useState<boolean>(true);

    return (
        <MenuContext.Provider value={{ menu, setMenu }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = () => {
    const context = useContext(MenuContext);
    if (!context) throw new Error("useMenu must be used within HomeProvider");
    return context;
};

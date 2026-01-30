import { useMenu } from "../context/MenuProvider"
import Chats from "./Chats"
import Navbar from "./Navbar"
import Search from "./Search"

const Sidebar = () => {
    const { menu } = useMenu()
    return (
        <>
            {menu ?
                <div className="sidebar">
                    < Navbar />
                    <Search />
                    <Chats />
                </div > : ""}</>
    )
}

export default Sidebar
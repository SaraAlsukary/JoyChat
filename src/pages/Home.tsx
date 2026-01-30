import Chat from "../components/Chat"
import Sidebar from "../components/Sidebar"
import { ChatProvider } from "../context/ChatProvider"
import { MenuProvider } from "../context/MenuProvider"

const Home = () => {
    return (
        <div className="home">
            <div className="container">
                <ChatProvider>
                    <MenuProvider>
                        <Sidebar />
                        <Chat />
                    </MenuProvider>
                </ChatProvider>
            </div>
        </div>
    )
}

export default Home
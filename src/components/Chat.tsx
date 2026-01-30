import Messages from './Messages'
import Input from './Input'
import { Camera, MessageCirclePlus, MoreVertical, SquareMenu } from 'lucide-react'
import { useChat } from '../context/ChatProvider';
import { useMenu } from '../context/MenuProvider';
const Chat = () => {
    const { setMenu, menu } = useMenu();
    const { selectedUser } = useChat();

    return (
        <div className='chat'>
            {selectedUser ? <>

                <div className="chat-info">
                    <div className="user">
                        <SquareMenu size={24} onClick={() => setMenu(!menu)} className='menu' />
                        <img src={
                            selectedUser.avatar_url ??
                            `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.username}&background=random`
                        } alt={selectedUser.username} />
                        <div className="user-data">
                            {/* <h3>{selectedUser?.username.split(' ', 1)[0]}</h3> */}
                            {selectedUser?.username.length > 10 ? <h3>{selectedUser?.username.slice(0, 7)}</h3> : <h3>{selectedUser?.username}</h3>}
                            <span>{selectedUser?.last_seen}</span>
                        </div>
                    </div>
                    <div className="chat-icons">
                        <Camera color="white" size={24} />
                        <MessageCirclePlus color="white" size={24} />
                        <MoreVertical color="white" size={24} />
                    </div>
                </div>
                <Messages />
                <Input />
            </> : <div className='default-chat'>
                <p>Select a user to start chat</p>
            </div>}
        </div>
    )
}

export default Chat
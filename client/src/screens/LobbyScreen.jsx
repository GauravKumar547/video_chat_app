import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
const LobbyScreen = () => {
    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");
    const socket = useSocket();
    const navigate = useNavigate();
    const handleSubmit = useCallback(
        (ev) => {
            ev.preventDefault();
            socket.emit("room:join", { email, room });
        },
        [email, room, socket]
    );
    const handleJoinRoom = useCallback(
        (data) => {
            const { email, room } = data;
            navigate(`/room/${room}`);
        },
        [navigate]
    );

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => {
            socket.off("room:join", handleJoinRoom);
        };
    }, [socket, handleJoinRoom]);
    return (
        <div>
            <h1>Lobby</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email ID</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        id="email"
                    />
                </div>
                <div>
                    <label htmlFor="room">Room Number</label>
                    <input
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        type="text"
                        id="room"
                    />
                </div>
                <button type="submit">Join</button>
            </form>
        </div>
    );
};

export default LobbyScreen;

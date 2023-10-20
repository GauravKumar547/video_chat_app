import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
const Room = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(email, id);
        setRemoteSocketId(id);
    }, []);
    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);
    // const handleVideoHide = useCallback(async () => {
    //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    //     setMyStream(stream);
    // }, []);
    const sendStreams = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
        }
    }, [myStream]);
    const handleIncomingCall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setMyStream(stream);
            const ans = await peer.getAnswer(offer);
            socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
    );

    const handleCallAccepted = useCallback(
        async ({ ans }) => {
            peer.setLocalDescription(ans);
            sendStreams();
        },
        [sendStreams]
    );
    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);
    const handleNegoNeedIncoming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );
    const handleNegoFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);
    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);
    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStreamVal = ev.streams;
            setRemoteStream(remoteStreamVal[0]);
        });
    }, []);
    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncoming);
        socket.on("peer:nego:final", handleNegoFinal);
        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incoming:call", handleIncomingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncoming);
            socket.off("peer:nego:final", handleNegoFinal);
        };
    }, [
        handleUserJoined,
        socket,
        handleIncomingCall,
        handleCallAccepted,
        handleNegoNeedIncoming,
        handleNegoFinal,
    ]);
    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? "Connected" : "no one in the room"}</h4>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}
            {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
            {/* {remoteSocketId && <button onClick={handleVideoHide}>hide</button>} */}
            <div>
                <h1>My Stream</h1>
                {myStream && (
                    <ReactPlayer height="125px" width="250px" playing muted url={myStream} />
                )}
            </div>
            <div>
                <h1>Remote Stream</h1>
                {remoteStream && (
                    <ReactPlayer height="125px" width="250px" playing muted url={remoteStream} />
                )}
            </div>
        </div>
    );
};

export default Room;

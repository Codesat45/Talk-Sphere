import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment";
import { MdCall, MdVideocam, MdCallMissed, MdCallReceived, MdCallMade } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";

const SERVER_ACCESS_BASE_URL =
  process.env.REACT_APP_SERVER_ACCESS_BASE_URL || "http://localhost:5000";

const CallLogs = ({ closeModal }) => {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const loggedUser = useSelector((globalState) => globalState.user.userDetails);
  const allChats = useSelector((globalState) => globalState.chat.chats);

  useEffect(() => {
    fetchAllCallHistory();
  }, []);

  const fetchAllCallHistory = async () => {
    try {
      setLoading(true);
      // Fetch call history for all chats
      const promises = allChats.map((chat) =>
        axios.get(`${SERVER_ACCESS_BASE_URL}/api/message/call-history/${chat._id}`)
      );
      const results = await Promise.all(promises);
      
      // Combine and sort all call history
      const allHistory = results.flatMap((res) => res.data);
      const sorted = allHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setCallHistory(sorted);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching call history:", error);
      setLoading(false);
    }
  };

  const getCallIcon = (call) => {
    if (call.status === "missed") {
      return <MdCallMissed className="text-red-500" />;
    }
    if (call.initiator._id === loggedUser._id) {
      return call.callType === "video" ? (
        <MdVideocam className="text-green-500" />
      ) : (
        <MdCallMade className="text-green-500" />
      );
    }
    return call.callType === "video" ? (
      <MdVideocam className="text-blue-500" />
    ) : (
      <MdCallReceived className="text-blue-500" />
    );
  };

  const getCallLabel = (call) => {
    if (call.status === "missed") return "Missed";
    if (call.initiator._id === loggedUser._id) return "Outgoing";
    return "Incoming";
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "Not connected";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getOtherUser = (call) => {
    return call.participants.find((p) => p._id !== loggedUser._id);
  };

  return (
    <Wrapper className="call-logs-tab dynamic-sidebar">
      <div className="relative chat-menu flex flex-wrap items-center justify-between w-full">
        <div>
          <h2>Call Logs</h2>
          <p>Recent calls history</p>
        </div>
        <div className="icon p-1 flex items-start h-full justify-start cursor-pointer">
          <div
            className="p-1 bg-white text-black rounded-full"
            onClick={closeModal}
          >
            <RxCross2 />
          </div>
        </div>
      </div>

      <div className="call-logs-list overflow-y-scroll">
        {loading ? (
          <div className="loading-state">
            <p>Loading call history...</p>
          </div>
        ) : callHistory.length === 0 ? (
          <div className="empty-state">
            <MdCall className="empty-icon" />
            <p>No call history yet</p>
            <small>Your call history will appear here</small>
          </div>
        ) : (
          <div className="calls-container">
            {callHistory.map((call) => {
              const otherUser = getOtherUser(call);
              return (
                <div key={call._id} className="call-item">
                  <div className="call-avatar">
                    <img
                      src={otherUser?.pic || "https://via.placeholder.com/50"}
                      alt={otherUser?.name || "User"}
                    />
                  </div>
                  <div className="call-details">
                    <h4>{otherUser?.name || "Unknown"}</h4>
                    <div className="call-info">
                      <span className="call-icon">{getCallIcon(call)}</span>
                      <span className="call-label">{getCallLabel(call)}</span>
                      <span className="call-time">
                        {moment(call.createdAt).format("MMM DD, h:mm A")}
                      </span>
                    </div>
                  </div>
                  <div className="call-duration">
                    <span>{formatDuration(call.duration)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  animation: fadeInLeft 1s;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .chat-menu {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
    background-color: ${({ theme }) => theme.colors.bg.primary};
  }

  .call-logs-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${({ theme }) => theme.colors.text.secondary};
    
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }
    
    p {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    
    small {
      opacity: 0.7;
    }
  }

  .calls-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .call-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: ${({ theme }) => theme.colors.bg.primary};
    border-radius: 8px;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.bg.secondary};
    }
  }

  .call-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 1rem;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .call-details {
    flex: 1;
    
    h4 {
      font-size: 1rem;
      font-weight: 500;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.25rem;
    }
  }

  .call-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    
    .call-icon {
      display: flex;
      align-items: center;
      font-size: 1.2rem;
    }
    
    .call-label {
      font-weight: 500;
    }
    
    .call-time {
      opacity: 0.7;
    }
  }

  .call-duration {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-weight: 500;
  }

  @media (max-width: 500px) {
    .call-item {
      padding: 0.75rem;
    }
    
    .call-avatar {
      width: 40px;
      height: 40px;
    }
    
    .call-details h4 {
      font-size: 0.9rem;
    }
    
    .call-info {
      font-size: 0.75rem;
    }
  }
`;

export default CallLogs;

import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { Button } from "../Styles/Button";
import { BiSmile } from "react-icons/bi";
import {
  MdAddCircle,
  MdCall,
  MdCallEnd,
  MdClose,
  MdContentCopy,
  MdDeleteOutline,
  MdEdit,
  MdImage,
  MdOutlineArrowBackIos,
  MdReply,
  MdSearch,
  MdVideocam,
} from "react-icons/md";
import { IoMdSend } from "react-icons/io";
import Dropdown from "./Dropdown";
import Picker from "@emoji-mart/react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  getSender,
  getSenderPic,
  isMyMessage,
} from "../HelperFunction/chat.Helper";
import {
  deleteMessage,
  deleteMessageForMe,
  editMessage,
  reactToMessage,
  replaceMessage,
  sendMessge,
  updateGetAllChats,
} from "../Redux/Reducer/Message/message.action";
import { Dialog, Menu, Transition } from "@headlessui/react";
import UserProfile from "./SlideMenu/UserProfile";
import io from "socket.io-client";
import Spinner from "../Styles/Spinner";

const SERVER_ACCESS_BASE_URL =
  process.env.REACT_APP_SERVER_ACCESS_BASE_URL || "http://localhost:5000";
const ENDPOINT = SERVER_ACCESS_BASE_URL;
const callConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let socket;
let selectedChatCompare;

const ChatWindow = () => {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const messageEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callStateRef = useRef(null);

  const [message, setMessage] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sender, setSender] = useState();
  const [cursorPosition, setCursorPosition] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [stories, setStories] = useState([]);
  const [storyText, setStoryText] = useState("");
  const [storyMediaUrl, setStoryMediaUrl] = useState("");
  const [activeStory, setActiveStory] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState({
    active: false,
    status: "",
    callType: "audio",
    remoteUser: null,
    chatId: null,
  });

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const senderUser = useSelector(
    (globalState) => globalState.chat.selectedChat
  );
  const loggedUser = useSelector((globalState) => globalState.user.userDetails);
  const theme = useSelector((state) => state.themeReducer.darkThemeEnabled);
  const allMessage = useSelector(
    (globalState) => globalState.message.allMessages
  );
  const createdMessage = useSelector(
    (globalState) => globalState.message.createdMessage
  );
  const loading = useSelector((globalState) => globalState.message.isLoading);

  const recipients =
    sender?.users?.filter((chatUser) => chatUser._id !== loggedUser?._id) || [];
  const primaryRecipient = recipients[0];

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const fetchStories = useCallback(async () => {
    try {
      const response = await axios.get(`${SERVER_ACCESS_BASE_URL}/api/story`);
      setStories(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const createStory = async () => {
    if (!storyText.trim() && !storyMediaUrl.trim()) {
      alert("Add story text or an image URL");
      return;
    }

    try {
      await axios.post(`${SERVER_ACCESS_BASE_URL}/api/story`, {
        text: storyText.trim(),
        mediaUrl: storyMediaUrl.trim(),
      });
      setStoryText("");
      setStoryMediaUrl("");
      fetchStories();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to create story");
    }
  };

  const viewStory = async (story) => {
    setActiveStory(story);
    try {
      const response = await axios.put(
        `${SERVER_ACCESS_BASE_URL}/api/story/${story._id}/view`
      );
      setActiveStory(response.data);
      fetchStories();
    } catch (error) {
      console.log(error);
    }
  };

  const removeStory = async (storyId) => {
    try {
      await axios.delete(`${SERVER_ACCESS_BASE_URL}/api/story/${storyId}`);
      setActiveStory(null);
      fetchStories();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete story");
    }
  };

  const getCallTarget = () => {
    if (!primaryRecipient) {
      alert("Select a one-to-one chat to start a call");
      return null;
    }
    return primaryRecipient;
  };

  const cleanupCall = useCallback(
    (notify = true) => {
      const currentCall = callStateRef.current;
      if (notify && currentCall?.remoteUser && socket) {
        socket.emit("call:end", {
          to: currentCall.remoteUser._id,
          from: loggedUser,
          chatId: currentCall.chatId,
        });
      }

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setIncomingCall(null);
      setCallState({
        active: false,
        status: "",
        callType: "audio",
        remoteUser: null,
        chatId: null,
      });
    },
    [loggedUser]
  );

  const createPeerConnection = useCallback(
    (remoteUser, chatId) => {
      const peerConnection = new RTCPeerConnection(callConfig);

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("call:ice-candidate", {
            to: remoteUser._id,
            from: loggedUser,
            candidate: event.candidate,
            chatId,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    },
    [loggedUser]
  );

  const startCall = async (callType) => {
    const remoteUser = getCallTarget();
    if (!remoteUser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const peerConnection = createPeerConnection(remoteUser, sender._id);
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      setCallState({
        active: true,
        status: "Calling...",
        callType,
        remoteUser,
        chatId: sender._id,
      });

      socket.emit("call:user", {
        to: remoteUser._id,
        from: loggedUser,
        signal: offer,
        callType,
        chatId: sender._id,
      });
    } catch (error) {
      alert("Camera or microphone permission is required for calls");
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const peerConnection = createPeerConnection(
        incomingCall.from,
        incomingCall.chatId
      );
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.signal)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("call:accept", {
        to: incomingCall.from._id,
        from: loggedUser,
        signal: answer,
        chatId: incomingCall.chatId,
      });

      setCallState({
        active: true,
        status: "Connected",
        callType: incomingCall.callType,
        remoteUser: incomingCall.from,
        chatId: incomingCall.chatId,
      });
      setIncomingCall(null);
    } catch (error) {
      alert("Camera or microphone permission is required for calls");
    }
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit("call:end", {
        to: incomingCall.from._id,
        from: loggedUser,
        chatId: incomingCall.chatId,
      });
    }
    setIncomingCall(null);
  };

  const pickEmoji = (emojiData) => {
    const ref = inputRef.current;
    ref.focus();
    const start = newMessage.substring(0, ref.selectionStart);
    const end = newMessage.substring(ref.selectionStart);
    const msg = start + emojiData.native + end;
    setNewMessage(msg);
    setCursorPosition(start.length + emojiData.native.length);
  };

  const userChathidden = () => {
    document.getElementById("user-chat").classList.remove("fadeInRight");
    document.getElementById("user-chat").classList.remove("user-chat-show");
    document.getElementById("user-chat").classList.add("fadeInRight2");
  };

  const closeChat = () => {
    const element = document.querySelectorAll("#chat-box-wrapper");
    element.forEach((item) => {
      item.classList.remove("active");
    });
  };

  const emitTyping = () => {
    if (!socketConnected || !primaryRecipient) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", primaryRecipient._id);
    }

    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", primaryRecipient._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const handleChange = (e) => {
    setNewMessage(e.target.value);
    emitTyping();
  };

  const handleSendMessage = async (extra = {}) => {
    if (!newMessage.trim() && !extra.mediaUrl) {
      alert("Empty message can't be sent");
      return;
    }

    if (primaryRecipient) {
      socket.emit("stop typing", primaryRecipient._id);
    }

    const messageData = {
      chatId: sender._id,
      content: newMessage.trim(),
      replyTo: replyingTo?._id,
      ...extra,
    };

    setNewMessage("");
    setReplyingTo(null);
    await dispatch(sendMessge(messageData));
  };

  const sendImageMessage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,.pdf,.doc,.docx";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show loading state
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          `${SERVER_ACCESS_BASE_URL}/api/message/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (response.data.success) {
          const messageType = response.data.resourceType === "video" ? "file" : 
                             response.data.resourceType === "image" ? "image" : "file";
          
          await handleSendMessage({
            messageType,
            mediaUrl: response.data.url,
            content: newMessage.trim() || file.name,
          });
        }
      } catch (error) {
        alert("Failed to upload file. Please try again.");
      }
    };
    input.click();
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm("Are you sure you want to delete this message for everyone?")) {
      dispatch(deleteMessage(messageId));
    }
  };

  const handleDeleteMessageForMe = (messageId) => {
    if (window.confirm("Delete this message for you only? Others will still see it.")) {
      dispatch(deleteMessageForMe(messageId));
    }
  };

  const handleEditMessage = async (item) => {
    const updatedContent = window.prompt("Edit message", item.content);
    if (!updatedContent || updatedContent === item.content) return;
    const updatedMessage = await dispatch(editMessage(item._id, updatedContent));
    if (updatedMessage) {
      socket?.emit("message update", updatedMessage);
    }
  };

  const handleReactToMessage = async (item, emoji) => {
    const updatedMessage = await dispatch(reactToMessage(item._id, emoji));
    if (updatedMessage) {
      socket?.emit("message update", updatedMessage);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard?.writeText(content);
  };

  const filteredMessages = message.filter((item) => {
    if (!searchTerm.trim()) return true;
    return item.content?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.selectionEnd = cursorPosition;
    }
  }, [cursorPosition]);

  useEffect(() => {
    setSender(senderUser);
    selectedChatCompare = senderUser;
  }, [senderUser]);

  useEffect(() => {
    if (!loggedUser) return;

    socket = io(ENDPOINT, {
      withCredentials: true,
      extraHeaders: {
        "my-custom-header": "abcd",
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
    socket.emit("setup", loggedUser);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("call:incoming", (payload) => setIncomingCall(payload));
    socket.on("call:accepted", async (payload) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(payload.signal)
        );
      }
      setCallState((current) => ({
        ...current,
        active: true,
        status: "Connected",
        remoteUser: payload.from,
      }));
    });
    socket.on("call:ice-candidate", async (payload) => {
      if (peerConnectionRef.current && payload.candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(payload.candidate)
        );
      }
    });
    socket.on("call:ended", () => cleanupCall(false));

    return () => {
      cleanupCall(false);
      socket.disconnect();
    };
  }, [cleanupCall, loggedUser]);

  useEffect(() => {
    const eventHandler = (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        return;
      }
      dispatch(updateGetAllChats(newMessageRecieved));
    };

    const updateHandler = (updatedMessage) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== updatedMessage.chat._id
      ) {
        return;
      }
      dispatch(replaceMessage(updatedMessage));
    };

    socket?.on("message recieved", eventHandler);
    socket?.on("message updated", updateHandler);

    return () => {
      socket?.off("message recieved", eventHandler);
      socket?.off("message updated", updateHandler);
    };
  }, [dispatch]);

  useEffect(() => {
    setMessage(allMessage || []);
    if (sender) {
      socket?.emit("join chat", sender);
    }
  }, [allMessage, sender]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behaviour: "smooth",
    });
  }, [message, newMessage]);

  useEffect(() => {
    if (!createdMessage?._id) return;
    socket?.emit("new message", createdMessage);
    dispatch(updateGetAllChats(createdMessage));
  }, [createdMessage, dispatch]);

  const renderMessageContent = (item) => (
    <>
      {item.replyTo && (
        <div className="reply-preview">
          <strong>{item.replyTo.sender?.name || "Message"}</strong>
          <span>{item.replyTo.content || item.replyTo.messageType}</span>
        </div>
      )}
      {item.messageType === "image" && item.mediaUrl ? (
        <a href={item.mediaUrl} target="_blank" rel="noreferrer">
          <img className="message-image" src={item.mediaUrl} alt="sent media" />
        </a>
      ) : null}
      {item.messageType === "file" && item.mediaUrl ? (
        <a 
          href={item.mediaUrl} 
          target="_blank" 
          rel="noreferrer"
          className="message-file-link"
        >
          📎 {item.content || "Download file"}
        </a>
      ) : null}
      {item.messageType === "text" && (
        <span className="mb-0 chat-content text-sm font-medium text-left">
          {item.content}
        </span>
      )}
      {item.isEdited && <small className="edited-label">edited</small>}
      {item.reactions?.length ? (
        <div className="reaction-row">
          {item.reactions.map((reaction) => (
            <span key={reaction._id || reaction.user?._id}>
              {reaction.emoji}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  const renderMessageActions = (item) => (
    <div className="message-actions">
      <button type="button" title="Reply" onClick={() => setReplyingTo(item)}>
        <MdReply />
      </button>
      <button type="button" title="Copy" onClick={() => copyMessage(item.content)}>
        <MdContentCopy />
      </button>
      <button type="button" onClick={() => handleReactToMessage(item, "👍")}>
        👍
      </button>
      <button type="button" onClick={() => handleReactToMessage(item, "❤️")}>
        ❤️
      </button>
      {/* Delete for me — available on ALL messages */}
      <button
        type="button"
        title="Delete for me"
        className="delete-for-me-btn"
        onClick={() => handleDeleteMessageForMe(item._id)}
      >
        <MdDeleteOutline />
      </button>
      {/* Delete for everyone — only sender can do this */}
      {isMyMessage(loggedUser, item) && (
        <>
          <button type="button" title="Edit" onClick={() => handleEditMessage(item)}>
            <MdEdit />
          </button>
          <button
            type="button"
            title="Delete for everyone"
            className="delete-for-all-btn"
            onClick={() => handleDeleteMessage(item._id)}
          >
            <MdDeleteOutline />
          </button>
        </>
      )}
    </div>
  );

  return (
    <Wrapper id="user-chat">
      <div className="chat-window-section">
        {!sender ? (
          <div className="chat-welcome-section overflow-x-hidden flex justify-center items-center">
            <div className="flex justify-center items-center p-4">
              <div className="flex flex-col justify-center items-center text-center">
                <div className="avatar mx-auto mb-4">
                  <div className="rounded-full">
                    <img src="./images/logo2.png" alt="logo" className="w-10" />
                  </div>
                </div>
                <h4>Welcome to Talk-Sphere Chat App</h4>
                <p>Click on user to start chat.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-content flex">
            <div className="w-full h-full position-relative">
              <div className="user-chat-topbar p-3 p-lg-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center">
                    <div
                      className="arrow-icon ml-5 mr-5 cursor-pointer text-2xl p-2 rounded-full"
                      onClick={userChathidden}
                    >
                      <MdOutlineArrowBackIos onClick={closeChat} />
                    </div>

                    <div className="flex items-center cursor-pointer" onClick={openModal}>
                      <div className="chat-avatar mr-4">
                        <img
                          src={
                            !sender.isGroupChat
                              ? getSenderPic(loggedUser, sender.users)
                              : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6wQvepXb0gM_Ft1QUOs6UyYJjPOmA-gq5Yw&usqp=CAU"
                          }
                          alt="profile"
                          className="w-12 h-12 rounded-full"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h6 className="mb-0">
                          {sender.isGroupChat
                            ? sender.chatName
                            : getSender(loggedUser, sender.users)}
                        </h6>
                        <p className="mb-0 truncate">
                          <small className="truncate">
                            {isTyping ? "typing..." : socketConnected ? "online" : "offline"}
                          </small>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="topbar-actions">
                    <button type="button" title="Audio call" onClick={() => startCall("audio")}>
                      <MdCall />
                    </button>
                    <button type="button" title="Video call" onClick={() => startCall("video")}>
                      <MdVideocam />
                    </button>
                    <div className="search-box">
                      <MdSearch />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search"
                      />
                    </div>
                    <div className="dropdown relative">
                      <Dropdown openModal={openModal} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="story-strip">
                <div className="story-create">
                  <input
                    value={storyText}
                    onChange={(event) => setStoryText(event.target.value)}
                    placeholder="Add story"
                  />
                  <input
                    value={storyMediaUrl}
                    onChange={(event) => setStoryMediaUrl(event.target.value)}
                    placeholder="Image URL"
                  />
                  <button type="button" onClick={createStory} title="Post story">
                    <MdAddCircle />
                  </button>
                </div>
                <div className="story-list">
                  {stories.map((story) => (
                    <button
                      type="button"
                      key={story._id}
                      className="story-avatar"
                      onClick={() => viewStory(story)}
                    >
                      <img src={story.user?.pic} alt={story.user?.name} />
                      <span>{story.user?._id === loggedUser?._id ? "You" : story.user?.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="chat-conversation p-3 p-lg-4">
                <ul className="chat-conversation-list">
                  {loading ? (
                    <div className="loader flex justify-center items-center">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      {filteredMessages.map((item) => {
                        const mine = isMyMessage(loggedUser, item) && item.sender.pic;
                        return (
                          <li key={item._id} className={mine ? "chat-list right" : "chat-list"}>
                            <div className="conversation-list">
                              <div className="chat-avatar mr-4">
                                <img
                                  src={item.sender.pic}
                                  alt={item.sender.name}
                                  className="rounded-full"
                                />
                              </div>
                              <div className="user-chat-content">
                                <div className="flex mb-3 message-row">
                                  {mine && renderMessageActions(item)}
                                  <div className="chat-wrap-content">
                                    {renderMessageContent(item)}
                                  </div>
                                  {!mine && renderMessageActions(item)}
                                </div>
                                <div className="conversation-name">
                                  <span className="ml-2 text-xs user-name">
                                    {mine ? "you" : item.sender.name}
                                  </span>
                                  <small className="ml-2 mb-0">
                                    {moment(item.createdAt)
                                      .format("DD/MMM/YYYY , h:mm a")
                                      .toUpperCase()}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                      {isTyping && (
                        <li className="chat-list">
                          <div className="conversation-list">
                            <div className="user-chat-content">
                              <div className="chat-wrap-content typing-bubble">
                                <span className="typing-loader"></span>
                              </div>
                            </div>
                          </div>
                        </li>
                      )}
                      <div ref={messageEndRef}></div>
                    </>
                  )}
                </ul>
              </div>

              {replyingTo && (
                <div className="replying-bar">
                  <div>
                    <strong>Replying to {replyingTo.sender?.name}</strong>
                    <span>{replyingTo.content}</span>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)}>
                    <MdClose />
                  </button>
                </div>
              )}

              <div className="chat-input-section p-5 p-lg-6">
                <div className="flex justify-between items-center">
                  <div className="chat-input flex">
                    <div className="links-list-item">
                      <Menu>
                        <Menu.Button className="flex justify-center items-center btn emoji-btn mr-2">
                          <BiSmile title="emoji" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="emoji-picker">
                            <Picker
                              theme={!theme ? "light" : "dark"}
                              onEmojiSelect={pickEmoji}
                            />
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                    <button
                      type="button"
                      className="btn emoji-btn mr-2"
                      title="Upload file (image, video, document)"
                      onClick={sendImageMessage}
                    >
                      <MdImage />
                    </button>
                  </div>
                  <div className="position-relative w-full">
                    <input
                      placeholder="Type your message..."
                      autoComplete="off"
                      id="chat-input"
                      className="w-full py-3 px-5 focus:outline-none"
                      value={newMessage}
                      onChange={handleChange}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      ref={inputRef}
                    />
                  </div>
                  <div className="chat-input-links ml-2" onClick={() => handleSendMessage()}>
                    <div className="links-list-items ml-5">
                      <Button className="btn submit-btn flex justify-center items-center">
                        <IoMdSend />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(callState.active || incomingCall) && (
          <div className="call-panel">
            {incomingCall && !callState.active ? (
              <>
                <h5>{incomingCall.from?.name} is calling</h5>
                <p>{incomingCall.callType === "video" ? "Video call" : "Audio call"}</p>
                <div className="call-actions">
                  <button type="button" className="accept-call" onClick={acceptCall}>
                    Accept
                  </button>
                  <button type="button" className="end-call" onClick={rejectCall}>
                    Decline
                  </button>
                </div>
              </>
            ) : (
              <>
                <h5>{callState.status}</h5>
                <p>{callState.remoteUser?.name}</p>
                <div className="video-grid">
                  <video ref={localVideoRef} autoPlay muted playsInline />
                  <video ref={remoteVideoRef} autoPlay playsInline />
                </div>
                <button type="button" className="end-call" onClick={() => cleanupCall(true)}>
                  <MdCallEnd /> End
                </button>
              </>
            )}
          </div>
        )}

        {activeStory && (
          <div className="story-modal">
            <div className="story-view">
              <button type="button" className="story-close" onClick={() => setActiveStory(null)}>
                <MdClose />
              </button>
              <div className="story-owner">
                <img src={activeStory.user?.pic} alt={activeStory.user?.name} />
                <span>{activeStory.user?.name}</span>
              </div>
              {activeStory.mediaUrl && (
                <img className="story-media" src={activeStory.mediaUrl} alt="story" />
              )}
              {activeStory.text && <p>{activeStory.text}</p>}
              <small>{activeStory.viewers?.length || 0} views</small>
              {activeStory.user?._id === loggedUser?._id && (
                <button
                  type="button"
                  className="story-delete"
                  onClick={() => removeStory(activeStory._id)}
                >
                  Delete story
                </button>
              )}
            </div>
          </div>
        )}

        <div className="absolute">
          <div className="flex items-center justify-center">
            <Transition appear show={isOpen} as={Fragment}>
              <Dialog
                as="div"
                className="user-profile-sidebar absolute z-50"
                onClose={closeModal}
              >
                <div className="dialog-wrapper z-50 fixed inset-0">
                  <div className="dialog-container flex min-h-full items-start justify-end text-center">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-in-out duration-300 transform"
                      enterFrom="translate-x-full scale-95"
                      enterTo="translate-x-100"
                      leave="ease-in-out duration-300 transform"
                      leaveFrom="translate-x-100"
                      leaveTo="translate-x-full"
                    >
                      <Dialog.Panel className="dialog-panel z-50 h-screen max-w-sm transform text-white text-left shadow-xl transition-all">
                        <UserProfile closeModal={closeModal} />
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  width: 100%;
  height: 100vh;

  .chat-window-section {
    width: 100%;
    height: 100%;
    min-width: auto;
    overflow: hidden;
    background-color: ${({ theme }) => theme.colors.bg.primary};
    position: relative;
  }
  .chat-content {
    width: 100%;
    height: 100vh;
    background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.1);
    background-image: url("/images/pattern-05.png");
  }
  .loader {
    width: 100%;
    height: 100%;
  }
  .btn {
    width: 43px;
    padding: 0;
    font-size: 1.4rem;
    color: #797c8c;
    cursor: pointer;
    &:hover {
      color: ${({ theme }) => theme.colors.primaryRgb};
    }
  }
  .emoji-picker {
    position: absolute;
    max-width: 100%;
    overflow-y: auto;
    z-index: 100;
    left: 10px;
    bottom: 100px;
  }
  .submit-btn {
    width: 50px;
    height: 43px;
  }
  .chat-welcome-section {
    width: 100%;
    height: 100vh;
    position: absolute;
    padding: 30px 30px 0;
  }
  .arrow-icon {
    background-color: ${({ theme }) => theme.colors.bg.secondary};
  }
  .user-chat-topbar {
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.bg.primary};
    z-index: 50;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    color: ${({ theme }) => theme.colors.heading};
    border-bottom: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
    animation: fadeInLeft 0.5s;
  }
  .topbar-actions,
  .search-box,
  .story-create,
  .story-list,
  .message-actions,
  .replying-bar,
  .call-actions {
    display: flex;
    align-items: center;
  }
  .topbar-actions {
    gap: 10px;
    button {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${({ theme }) => theme.colors.heading};
      background-color: ${({ theme }) => theme.colors.bg.secondary};
      font-size: 1.2rem;
    }
  }
  .search-box {
    gap: 6px;
    padding: 8px 10px;
    border-radius: 999px;
    background-color: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    input {
      width: 130px;
      background: transparent;
      outline: none;
      color: ${({ theme }) => theme.colors.heading};
      font-size: 0.85rem;
    }
  }
  .story-strip {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    background-color: ${({ theme }) => theme.colors.bg.primary};
    border-bottom: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.25);
  }
  .story-create {
    gap: 8px;
    input {
      width: 120px;
      padding: 8px 10px;
      border-radius: 8px;
      background-color: ${({ theme }) => theme.colors.bg.secondary};
      color: ${({ theme }) => theme.colors.heading};
      outline: none;
      font-size: 0.8rem;
    }
    button {
      color: ${({ theme }) => theme.colors.primaryRgb};
      font-size: 1.7rem;
    }
  }
  .story-list {
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .story-avatar {
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colors.heading};
    font-size: 0.78rem;
    white-space: nowrap;
    img {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${({ theme }) => theme.colors.primaryRgb};
    }
  }
  .chat-conversation {
    overflow-y: scroll;
    height: calc(100vh - 210px);
    .chat-conversation-list {
      padding-bottom: 24px;
      margin-bottom: 0;
      animation: fadeInLeft 0.5s;
      li {
        margin: 0;
        display: flex;
        .conversation-list {
          margin-bottom: 24px;
          display: inline-flex;
          position: relative;
          align-items: flex-start;
          justify-content: center;
          max-width: 84%;
          .user-name {
            color: ${({ theme }) => theme.colors.heading};
          }
          .chat-avatar {
            position: relative;
            overflow: hidden;
            border-radius: 100%;
            width: 3rem;
            height: 3rem;
            flex: 0 0 auto;
          }
          .chat-wrap-content {
            padding: 12px 16px;
            background-color: ${({ theme }) => theme.colors.bg.primary};
            position: relative;
            border-radius: 18px 8px 18px 18px;
            box-shadow: 0 2px 4px rgb(15 34 58 / 12%);
            color: ${({ theme }) => theme.colors.heading};
            max-width: min(560px, 70vw);
            word-break: break-word;
          }
          .conversation-name {
            font-size: 14px;
            font-weight: 500;
            color: ${({ theme }) => theme.colors.text.secondary};
          }
        }
      }
      .chat-list.right {
        justify-content: end;
        .conversation-list {
          text-align: right;
          flex-direction: row-reverse;
          .chat-avatar {
            margin-right: 0;
            margin-left: 16px;
          }
          .chat-wrap-content {
            color: ${({ theme }) => theme.colors.white};
            background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.75);
          }
        }
      }
    }
  }
  .message-row {
    align-items: flex-start;
    gap: 8px;
  }
  .message-actions {
    gap: 5px;
    opacity: 0;
    transition: opacity 0.2s ease;
    button {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background-color: ${({ theme }) => theme.colors.bg.primary};
      color: ${({ theme }) => theme.colors.text.secondary};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 5px rgb(15 34 58 / 12%);
      font-size: 0.8rem;
    }
    .delete-for-me-btn {
      color: #f59e0b;
      &:hover { background-color: rgba(245,158,11,0.12); }
    }
    .delete-for-all-btn {
      color: #ef4444;
      &:hover { background-color: rgba(239,68,68,0.12); }
    }
  }
  .message-row:hover .message-actions {
    opacity: 1;
  }
  .reply-preview {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    margin-bottom: 8px;
    border-left: 3px solid currentColor;
    background: rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    font-size: 0.78rem;
    span {
      opacity: 0.8;
    }
  }
  .message-image {
    max-width: 260px;
    max-height: 260px;
    border-radius: 10px;
    object-fit: cover;
    display: block;
    margin-bottom: 8px;
  }
  .message-file-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.12);
    border-radius: 8px;
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.9rem;
    margin-bottom: 8px;
    &:hover {
      background: rgba(59, 130, 246, 0.2);
    }
  }
  .edited-label,
  .reaction-row {
    display: block;
    margin-top: 5px;
    font-size: 0.72rem;
    opacity: 0.75;
  }
  .reaction-row {
    display: flex;
    gap: 4px;
  }
  .typing-bubble {
    min-width: 64px;
    min-height: 36px;
  }
  .typing-loader:before {
    content: "typing...";
  }
  .replying-bar {
    justify-content: space-between;
    gap: 12px;
    padding: 10px 18px;
    background-color: ${({ theme }) => theme.colors.bg.primary};
    border-top: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.25);
    color: ${({ theme }) => theme.colors.heading};
    div {
      display: grid;
      gap: 2px;
    }
    span {
      color: ${({ theme }) => theme.colors.text.secondary};
      font-size: 0.85rem;
    }
    button {
      font-size: 1.3rem;
    }
  }
  .chat-input-section {
    position: sticky;
    left: 0;
    top: 100vh;
    background-color: ${({ theme }) => theme.colors.bg.primary};
    border-top: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    input {
      color: ${({ theme }) => theme.colors.heading};
      background-color: ${({ theme }) => theme.colors.bg.secondary};
      &:focus {
        background-color: ${({ theme }) => theme.colors.bg.secondary};
      }
    }
    .emoji-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: 100%;
      &:hover {
        color: ${({ theme }) => theme.colors.primaryRgb};
        background-color: ${({ theme }) => theme.colors.bg.secondary};
      }
    }
    .links-list-items {
      .btn {
        color: #fff;
        background-color: ${({ theme }) => theme.colors.primaryRgb};
        &:hover {
          background-color: rgb(${({ theme }) => theme.colors.rgb.primary}, 0.8);
        }
        border-color: ${({ theme }) => theme.colors.primaryRgb};
      }
    }
  }
  .call-panel,
  .story-modal {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.58);
  }
  .call-panel {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.92);
    color: #fff;
    h5 {
      font-size: 1.2rem;
    }
  }
  .video-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 320px));
    gap: 10px;
    video {
      width: 100%;
      aspect-ratio: 4 / 3;
      background: #111827;
      border-radius: 8px;
      object-fit: cover;
    }
  }
  .call-actions {
    gap: 10px;
  }
  .accept-call,
  .end-call {
    padding: 10px 16px;
    border-radius: 999px;
    color: #fff;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .accept-call {
    background: #16a34a;
  }
  .end-call {
    background: #dc2626;
  }
  .story-view {
    width: min(420px, 92vw);
    min-height: 520px;
    position: relative;
    border-radius: 8px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    color: #fff;
    background: linear-gradient(145deg, #111827, #16a34a);
  }
  .story-close {
    position: absolute;
    right: 12px;
    top: 12px;
    font-size: 1.5rem;
  }
  .story-owner {
    position: absolute;
    left: 14px;
    top: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    img {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
    }
  }
  .story-media {
    max-height: 360px;
    width: 100%;
    object-fit: contain;
    border-radius: 8px;
  }
  .story-delete {
    align-self: flex-start;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(220, 38, 38, 0.9);
  }
  .dropdown-menu {
    top: 70px;
    z-index: 101;
    font-size: 1.1rem;
    min-width: 15rem;
    right: 0;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    background-color: ${({ theme }) => theme.colors.bg.primary};
  }

  @media screen and (min-width: 800px) {
    .arrow-icon {
      display: none;
    }
  }

  @media screen and (max-width: 800px) {
    .topbar-actions {
      gap: 5px;
    }
    .search-box input {
      width: 70px;
    }
    .story-strip {
      align-items: flex-start;
      flex-direction: column;
    }
    .chat-conversation {
      height: calc(100vh - 270px);
    }
    .video-grid {
      grid-template-columns: 1fr;
      width: min(92vw, 360px);
    }
  }
`;

export default ChatWindow;

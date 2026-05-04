import React, { useEffect, useState, Fragment } from "react";
import { ImBlocked, ImExit } from "react-icons/im";
import { CgProfile } from "react-icons/cg";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";

import { Menu, Transition } from "@headlessui/react";
import UserProfile from "./SlideMenu/UserProfile";
import { MdFavorite } from "react-icons/md";
import { toast } from "react-toastify";
import { deleteChatForMe } from "../Redux/Reducer/Message/message.action";
import { clearSelectChatAction } from "../Redux/Reducer/Chat/chat.action";

const SERVER_ACCESS_BASE_URL =
  process.env.REACT_APP_SERVER_ACCESS_BASE_URL || "http://localhost:5000";

const Dropdown = (props) => {
  const [sender, setSender] = useState();
  const dispatch = useDispatch();

  const senderUser = useSelector(
    (globalState) => globalState.chat.selectedChat
  );
  const loggedUser = useSelector((globalState) => globalState.user.userDetails);

  const handleClickMarkAsFavourites = () => {
    toast.success("We are working this feature. Available Soon", {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };
  
  const handleClickDeleteChat = async () => {
    if (!sender?._id) return;
    
    if (window.confirm("Delete this chat? All messages will be removed from your view.")) {
      try {
        await dispatch(deleteChatForMe(sender._id));
        dispatch(clearSelectChatAction());
        toast.success("Chat deleted successfully", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } catch (error) {
        toast.error("Failed to delete chat", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    }
  };
  
  const handleClickLeaveGroup = async () => {
    if (!sender?.isGroupChat) {
      toast.info("Block feature coming soon", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to leave "${sender.chatName}"?`)) {
      try {
        await axios.put(
          `${SERVER_ACCESS_BASE_URL}/api/chat/groupremove`,
          {
            chatId: sender._id,
            userId: loggedUser._id,
          }
        );
        
        dispatch(clearSelectChatAction());
        
        toast.success("You have left the group", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        
        // Refresh the page to update chat list
        window.location.reload();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to leave group", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    }
  };
  useEffect(() => {
    setSender(senderUser);
  }, [senderUser]);
  return (
    <>
      <Menu>
        <Menu.Button className="btn three-dot-btn">
          <BiDotsVerticalRounded />
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
          <Menu.Items className="dropdown-menu absolute py-4 px-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active
                      ? "active dropdown-item"
                      : "dropdown-item"
                  }`}
                  onClick={props.openModal}
                >
                  <div className="icon-btn btn-outline-primary">
                    <CgProfile className="icon" />
                  </div>
                  <span className="dropdown-text">View Contact</span>
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active
                      ? "active dropdown-item"
                      : "dropdown-item"
                  }`}
                  onClick={handleClickMarkAsFavourites}
                >
                  <div className="icon-btn btn-outline-danger">
                    <MdFavorite className="icon" />
                  </div>
                  <span className="dropdown-text">Mark As Favourites</span>
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active
                      ? "active dropdown-item"
                      : "dropdown-item"
                  }`}
                  onClick={handleClickDeleteChat}
                >
                  <div className="icon-btn btn-outline-danger">
                    <RiDeleteBin6Line className="icon" />
                  </div>
                  <span className="dropdown-text">Delete Chat</span>
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active
                      ? "active dropdown-item"
                      : "dropdown-item"
                  }`}
                  onClick={handleClickLeaveGroup}
                >
                  <div className="icon-btn btn-outline-light">
                    {sender?.isGroupChat ? (
                      <ImExit className="icon" />
                    ) : (
                      <ImBlocked className="icon" />
                    )}
                  </div>
                  <span className="dropdown-text">
                    {sender?.isGroupChat ? "Leave Group" : "Block"}
                  </span>
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
};

export default Dropdown;

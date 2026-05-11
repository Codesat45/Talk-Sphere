import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { useSelector } from "react-redux";
import { MdScheduleSend, MdAutorenew, MdDelete } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";

const SERVER_ACCESS_BASE_URL =
  process.env.REACT_APP_SERVER_ACCESS_BASE_URL || "http://localhost:5000";

const ScheduledMessages = ({ closeModal }) => {
  const [activeTab, setActiveTab] = useState("scheduled");
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [autoReply, setAutoReply] = useState({ enabled: false, message: "" });
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const loggedUser = useSelector((globalState) => globalState.user.userDetails);
  const allChats = useSelector((globalState) => globalState.chat.chats);

  const [scheduleForm, setScheduleForm] = useState({
    chatId: "",
    content: "",
    scheduledTime: "",
  });

  const [autoReplyForm, setAutoReplyForm] = useState({
    message: "",
    enabled: true,
    startTime: "",
    endTime: "",
    applyToAll: true,
  });

  useEffect(() => {
    fetchScheduledMessages();
    fetchAutoReply();
  }, []);

  const fetchScheduledMessages = async () => {
    try {
      const { data } = await axios.get(`${SERVER_ACCESS_BASE_URL}/api/scheduled/scheduled`);
      setScheduledMessages(data);
    } catch (error) {
      console.error("Error fetching scheduled messages:", error);
    }
  };

  const fetchAutoReply = async () => {
    try {
      const { data } = await axios.get(`${SERVER_ACCESS_BASE_URL}/api/scheduled/auto-reply`);
      setAutoReply(data);
      setAutoReplyForm({
        message: data.message || "",
        enabled: data.enabled || false,
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        applyToAll: data.applyToAll !== undefined ? data.applyToAll : true,
      });
    } catch (error) {
      console.error("Error fetching auto reply:", error);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!scheduleForm.chatId || !scheduleForm.content || !scheduleForm.scheduledTime) {
      toast.error("All fields are required");
      return;
    }

    try {
      await axios.post(`${SERVER_ACCESS_BASE_URL}/api/scheduled/scheduled`, scheduleForm);
      toast.success("Message scheduled successfully!");
      setShowScheduleForm(false);
      setScheduleForm({ chatId: "", content: "", scheduledTime: "" });
      fetchScheduledMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule message");
    }
  };

  const cancelScheduledMessage = async (id) => {
    if (!window.confirm("Cancel this scheduled message?")) return;

    try {
      await axios.delete(`${SERVER_ACCESS_BASE_URL}/api/scheduled/scheduled/${id}`);
      toast.success("Scheduled message cancelled");
      fetchScheduledMessages();
    } catch (error) {
      toast.error("Failed to cancel message");
    }
  };

  const handleAutoReplySubmit = async (e) => {
    e.preventDefault();

    if (!autoReplyForm.message) {
      toast.error("Auto reply message is required");
      return;
    }

    try {
      await axios.post(`${SERVER_ACCESS_BASE_URL}/api/scheduled/auto-reply`, autoReplyForm);
      toast.success("Auto reply updated successfully!");
      fetchAutoReply();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update auto reply");
    }
  };

  const deleteAutoReply = async () => {
    if (!window.confirm("Delete auto reply?")) return;

    try {
      await axios.delete(`${SERVER_ACCESS_BASE_URL}/api/scheduled/auto-reply`);
      toast.success("Auto reply deleted");
      fetchAutoReply();
    } catch (error) {
      toast.error("Failed to delete auto reply");
    }
  };

  return (
    <Wrapper className="scheduled-messages dynamic-sidebar">
      <div className="relative chat-menu flex flex-wrap items-center justify-between w-full">
        <div>
          <h2>Scheduled & Auto Reply</h2>
          <p>Manage scheduled messages and auto replies</p>
        </div>
        <div className="icon p-1 flex items-start h-full justify-start cursor-pointer">
          <div className="p-1 bg-white text-black rounded-full" onClick={closeModal}>
            <RxCross2 />
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "scheduled" ? "tab active" : "tab"}
          onClick={() => setActiveTab("scheduled")}
        >
          <MdScheduleSend /> Scheduled Messages
        </button>
        <button
          className={activeTab === "autoreply" ? "tab active" : "tab"}
          onClick={() => setActiveTab("autoreply")}
        >
          <MdAutorenew /> Auto Reply
        </button>
      </div>

      <div className="content overflow-y-scroll">
        {activeTab === "scheduled" ? (
          <>
            {!showScheduleForm ? (
              <>
                <button className="create-btn" onClick={() => setShowScheduleForm(true)}>
                  Schedule New Message
                </button>

                <div className="messages-list">
                  {scheduledMessages.length === 0 ? (
                    <div className="empty-state">
                      <MdScheduleSend className="empty-icon" />
                      <p>No scheduled messages</p>
                    </div>
                  ) : (
                    scheduledMessages.map((msg) => (
                      <div key={msg._id} className="message-card">
                        <div className="message-header">
                          <strong>To: {msg.chat.chatName || "Chat"}</strong>
                          <button className="delete-icon" onClick={() => cancelScheduledMessage(msg._id)}>
                            <MdDelete />
                          </button>
                        </div>
                        <p className="message-content">{msg.content}</p>
                        <div className="message-time">
                          📅 {new Date(msg.scheduledTime).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <form className="schedule-form" onSubmit={handleScheduleSubmit}>
                <h3>Schedule Message</h3>

                <select
                  value={scheduleForm.chatId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, chatId: e.target.value })}
                  required
                >
                  <option value="">Select Chat</option>
                  {allChats.map((chat) => (
                    <option key={chat._id} value={chat._id}>
                      {chat.chatName || chat.users.find((u) => u._id !== loggedUser._id)?.name}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Message content"
                  value={scheduleForm.content}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, content: e.target.value })}
                  rows="4"
                  required
                />

                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                  required
                />

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowScheduleForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Schedule
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <form className="autoreply-form" onSubmit={handleAutoReplySubmit}>
            <h3>Auto Reply Settings</h3>

            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoReplyForm.enabled}
                onChange={(e) => setAutoReplyForm({ ...autoReplyForm, enabled: e.target.checked })}
              />
              <span>Enable Auto Reply</span>
            </label>

            <textarea
              placeholder="Auto reply message"
              value={autoReplyForm.message}
              onChange={(e) => setAutoReplyForm({ ...autoReplyForm, message: e.target.value })}
              rows="4"
              required
            />

            <label>Start Time (Optional)</label>
            <input
              type="datetime-local"
              value={autoReplyForm.startTime}
              onChange={(e) => setAutoReplyForm({ ...autoReplyForm, startTime: e.target.value })}
            />

            <label>End Time (Optional)</label>
            <input
              type="datetime-local"
              value={autoReplyForm.endTime}
              onChange={(e) => setAutoReplyForm({ ...autoReplyForm, endTime: e.target.value })}
            />

            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoReplyForm.applyToAll}
                onChange={(e) => setAutoReplyForm({ ...autoReplyForm, applyToAll: e.target.checked })}
              />
              <span>Apply to all chats</span>
            </label>

            <div className="form-actions">
              <button type="button" className="delete-btn" onClick={deleteAutoReply}>
                Delete
              </button>
              <button type="submit" className="submit-btn">
                Save Auto Reply
              </button>
            </div>
          </form>
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
  background-color: ${({ theme }) => theme.colors.bg.primary};

  .chat-menu {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);

    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.25rem;
    }

    p {
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);

    .tab {
      flex: 1;
      padding: 1rem;
      background: transparent;
      border: none;
      color: ${({ theme }) => theme.colors.text.secondary};
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.05);
      }

      &.active {
        color: ${({ theme }) => theme.colors.primaryRgb};
        border-bottom: 2px solid ${({ theme }) => theme.colors.primaryRgb};
      }

      svg {
        font-size: 1.2rem;
      }
    }
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .create-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: ${({ theme }) => theme.colors.primaryRgb};
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 1.5rem;

    &:hover {
      opacity: 0.9;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1rem;
    color: ${({ theme }) => theme.colors.text.secondary};

    .empty-icon {
      font-size: 4rem;
      opacity: 0.3;
      margin-bottom: 1rem;
    }
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .message-card {
    background-color: ${({ theme }) => theme.colors.bg.secondary};
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.2);

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      strong {
        font-size: 0.95rem;
        color: ${({ theme }) => theme.colors.heading};
      }

      .delete-icon {
        background: transparent;
        border: none;
        color: #dc2626;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .message-content {
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.5rem;
    }

    .message-time {
      font-size: 0.85rem;
      color: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  .schedule-form,
  .autoreply-form {
    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      border: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
      background-color: ${({ theme }) => theme.colors.bg.secondary};
      color: ${({ theme }) => theme.colors.heading};
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: ${({ theme }) => theme.colors.primaryRgb};
      }
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      cursor: pointer;

      input[type="checkbox"] {
        width: auto;
        margin: 0;
      }

      span {
        font-size: 0.95rem;
        color: ${({ theme }) => theme.colors.heading};
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;

      button {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }

      .cancel-btn,
      .delete-btn {
        background-color: ${({ theme }) => theme.colors.bg.secondary};
        color: ${({ theme }) => theme.colors.heading};

        &:hover {
          background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.1);
        }
      }

      .delete-btn {
        background-color: #dc2626;
        color: #fff;

        &:hover {
          background-color: #b91c1c;
        }
      }

      .submit-btn {
        background-color: ${({ theme }) => theme.colors.primaryRgb};
        color: #fff;

        &:hover {
          opacity: 0.9;
        }
      }
    }
  }

  @media (max-width: 500px) {
    .content {
      padding: 1rem;
    }
  }
`;

export default ScheduledMessages;

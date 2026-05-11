import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { useSelector } from "react-redux";
import { MdClose, MdAdd, MdUpload, MdVideoCall, MdSchedule } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";

const SERVER_ACCESS_BASE_URL =
  process.env.REACT_APP_SERVER_ACCESS_BASE_URL || "http://localhost:5000";

const MeetingScheduler = ({ closeModal }) => {
  const [meetings, setMeetings] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const loggedUser = useSelector((globalState) => globalState.user.userDetails);
  const allChats = useSelector((globalState) => globalState.chat.chats);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    participants: [],
    scheduledTime: "",
    duration: 60,
    meetingType: "video",
    recordingUrl: "",
    presentationUrl: "",
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data } = await axios.get(`${SERVER_ACCESS_BASE_URL}/api/meeting`);
      setMeetings(data);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleParticipantToggle = (userId) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId],
    }));
  };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${SERVER_ACCESS_BASE_URL}/api/message/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        return response.data.url;
      }
    } catch (error) {
      toast.error("File upload failed");
      return null;
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setLoading(true);
    const url = await uploadFile(file);
    setLoading(false);

    if (url) {
      if (type === "recording") {
        setFormData({ ...formData, recordingUrl: url });
        toast.success("Recording uploaded");
      } else {
        setFormData({ ...formData, presentationUrl: url });
        toast.success("Presentation uploaded");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.scheduledTime) {
      toast.error("Title and scheduled time are required");
      return;
    }

    if (formData.participants.length > 50) {
      toast.error("Maximum 50 participants allowed");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${SERVER_ACCESS_BASE_URL}/api/meeting`, formData);
      toast.success("Meeting scheduled successfully!");
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        participants: [],
        scheduledTime: "",
        duration: 60,
        meetingType: "video",
        recordingUrl: "",
        presentationUrl: "",
      });
      fetchMeetings();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Failed to schedule meeting");
    }
  };

  const deleteMeeting = async (id) => {
    if (!window.confirm("Delete this meeting?")) return;

    try {
      await axios.delete(`${SERVER_ACCESS_BASE_URL}/api/meeting/${id}`);
      toast.success("Meeting deleted");
      fetchMeetings();
    } catch (error) {
      toast.error("Failed to delete meeting");
    }
  };

  const getParticipantsList = () => {
    const allUsers = [];
    allChats.forEach((chat) => {
      chat.users.forEach((user) => {
        if (user._id !== loggedUser._id && !allUsers.find((u) => u._id === user._id)) {
          allUsers.push(user);
        }
      });
    });
    return allUsers;
  };

  return (
    <Wrapper className="meeting-scheduler dynamic-sidebar">
      <div className="relative chat-menu flex flex-wrap items-center justify-between w-full">
        <div>
          <h2>Meeting Scheduler</h2>
          <p>Schedule and manage meetings</p>
        </div>
        <div className="icon p-1 flex items-start h-full justify-start cursor-pointer">
          <div className="p-1 bg-white text-black rounded-full" onClick={closeModal}>
            <RxCross2 />
          </div>
        </div>
      </div>

      <div className="meeting-content overflow-y-scroll">
        {!showCreateForm ? (
          <>
            <button className="create-meeting-btn" onClick={() => setShowCreateForm(true)}>
              <MdAdd /> Schedule New Meeting
            </button>

            <div className="meetings-list">
              <h3>Upcoming Meetings</h3>
              {meetings.filter((m) => m.status === "scheduled").length === 0 ? (
                <div className="empty-state">
                  <MdSchedule className="empty-icon" />
                  <p>No upcoming meetings</p>
                </div>
              ) : (
                meetings
                  .filter((m) => m.status === "scheduled")
                  .map((meeting) => (
                    <div key={meeting._id} className="meeting-card">
                      <div className="meeting-header">
                        <h4>{meeting.title}</h4>
                        <span className="meeting-type">
                          {meeting.meetingType === "video" ? <MdVideoCall /> : "🎤"}
                        </span>
                      </div>
                      <p className="meeting-desc">{meeting.description}</p>
                      <div className="meeting-info">
                        <span>📅 {new Date(meeting.scheduledTime).toLocaleString()}</span>
                        <span>⏱️ {meeting.duration} min</span>
                        <span>👥 {meeting.participants.length} participants</span>
                      </div>
                      {meeting.recordingUrl && (
                        <a href={meeting.recordingUrl} target="_blank" rel="noreferrer" className="file-link">
                          📹 Recording
                        </a>
                      )}
                      {meeting.presentationUrl && (
                        <a href={meeting.presentationUrl} target="_blank" rel="noreferrer" className="file-link">
                          📊 Presentation
                        </a>
                      )}
                      {meeting.organizer._id === loggedUser._id && (
                        <button className="delete-btn" onClick={() => deleteMeeting(meeting._id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>
          </>
        ) : (
          <form className="create-form" onSubmit={handleSubmit}>
            <h3>Schedule New Meeting</h3>

            <input
              type="text"
              name="title"
              placeholder="Meeting Title *"
              value={formData.title}
              onChange={handleInputChange}
              required
            />

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
            />

            <input
              type="datetime-local"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleInputChange}
              required
            />

            <input
              type="number"
              name="duration"
              placeholder="Duration (minutes)"
              value={formData.duration}
              onChange={handleInputChange}
              min="15"
              max="480"
            />

            <select name="meetingType" value={formData.meetingType} onChange={handleInputChange}>
              <option value="video">Video Call</option>
              <option value="audio">Audio Call</option>
            </select>

            <div className="participants-section">
              <h4>Select Participants (Max 50)</h4>
              <div className="participants-list">
                {getParticipantsList().map((user) => (
                  <label key={user._id} className="participant-item">
                    <input
                      type="checkbox"
                      checked={formData.participants.includes(user._id)}
                      onChange={() => handleParticipantToggle(user._id)}
                    />
                    <img src={user.pic} alt={user.name} />
                    <span>{user.name}</span>
                  </label>
                ))}
              </div>
              <small>{formData.participants.length} selected</small>
            </div>

            <div className="file-uploads">
              <label className="upload-label">
                <MdUpload /> Upload Recording/Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, "recording")}
                  style={{ display: "none" }}
                />
              </label>
              {formData.recordingUrl && <span className="file-uploaded">✓ Recording uploaded</span>}

              <label className="upload-label">
                <MdUpload /> Upload Presentation/PPT
                <input
                  type="file"
                  accept=".ppt,.pptx,.pdf"
                  onChange={(e) => handleFileUpload(e, "presentation")}
                  style={{ display: "none" }}
                />
              </label>
              {formData.presentationUrl && <span className="file-uploaded">✓ Presentation uploaded</span>}
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Meeting"}
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

  .meeting-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .create-meeting-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: ${({ theme }) => theme.colors.primaryRgb};
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    &:hover {
      opacity: 0.9;
    }

    svg {
      font-size: 1.3rem;
    }
  }

  .meetings-list {
    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1rem;
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

  .meeting-card {
    background-color: ${({ theme }) => theme.colors.bg.secondary};
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.2);

    .meeting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      h4 {
        font-size: 1rem;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.heading};
      }

      .meeting-type {
        font-size: 1.5rem;
      }
    }

    .meeting-desc {
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.text.secondary};
      margin-bottom: 0.75rem;
    }

    .meeting-info {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.85rem;
      color: ${({ theme }) => theme.colors.text.secondary};
      margin-bottom: 0.75rem;
    }

    .file-link {
      display: inline-block;
      margin-right: 1rem;
      margin-bottom: 0.5rem;
      color: ${({ theme }) => theme.colors.primaryRgb};
      font-size: 0.9rem;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .delete-btn {
      padding: 0.5rem 1rem;
      background-color: #dc2626;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      margin-top: 0.5rem;

      &:hover {
        background-color: #b91c1c;
      }
    }
  }

  .create-form {
    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.5rem;
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

    .participants-section {
      margin-bottom: 1.5rem;

      h4 {
        font-size: 1rem;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.heading};
        margin-bottom: 0.75rem;
      }

      .participants-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
        border-radius: 8px;
        padding: 0.5rem;
        margin-bottom: 0.5rem;

        .participant-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 6px;

          &:hover {
            background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.1);
          }

          input[type="checkbox"] {
            width: auto;
            margin: 0;
          }

          img {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
          }

          span {
            font-size: 0.9rem;
            color: ${({ theme }) => theme.colors.heading};
          }
        }
      }

      small {
        font-size: 0.85rem;
        color: ${({ theme }) => theme.colors.text.secondary};
      }
    }

    .file-uploads {
      margin-bottom: 1.5rem;

      .upload-label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.1);
        color: ${({ theme }) => theme.colors.primaryRgb};
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-right: 1rem;
        margin-bottom: 0.5rem;

        &:hover {
          background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.2);
        }
      }

      .file-uploaded {
        color: #10b981;
        font-size: 0.85rem;
        font-weight: 600;
        margin-left: 0.5rem;
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;

      button {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .cancel-btn {
        background-color: ${({ theme }) => theme.colors.bg.secondary};
        color: ${({ theme }) => theme.colors.heading};

        &:hover {
          background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.1);
        }
      }

      .submit-btn {
        background-color: ${({ theme }) => theme.colors.primaryRgb};
        color: #fff;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      }
    }
  }

  @media (max-width: 500px) {
    .meeting-content {
      padding: 1rem;
    }
  }
`;

export default MeetingScheduler;

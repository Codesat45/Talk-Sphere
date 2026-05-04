import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { useSelector } from "react-redux";
import { MdAddCircle, MdClose, MdImage } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";

const SERVER_ACCESS_BASE_URL =
  process.env.REACT_APP_SERVER_ACCESS_BASE_URL || "http://localhost:5000";

const Stories = ({ closeModal }) => {
  const [stories, setStories] = useState([]);
  const [storyText, setStoryText] = useState("");
  const [storyMediaUrl, setStoryMediaUrl] = useState("");
  const [activeStory, setActiveStory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const loggedUser = useSelector((globalState) => globalState.user.userDetails);

  const fetchStories = useCallback(async () => {
    try {
      const response = await axios.get(`${SERVER_ACCESS_BASE_URL}/api/story`);
      setStories(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const uploadStoryMedia = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        setUploading(true);
        const response = await axios.post(
          `${SERVER_ACCESS_BASE_URL}/api/message/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (response.data.success) {
          setStoryMediaUrl(response.data.url);
          alert("Media uploaded successfully!");
        }
        setUploading(false);
      } catch (error) {
        alert("Failed to upload media. Please try again.");
        setUploading(false);
      }
    };
    input.click();
  };

  const createStory = async () => {
    if (!storyText.trim() && !storyMediaUrl.trim()) {
      alert("Add story text or an image/video");
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
      alert("Story posted successfully!");
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

  return (
    <Wrapper className="stories-tab dynamic-sidebar">
      <div className="relative chat-menu flex flex-wrap items-center justify-between w-full">
        <div>
          <h2>Stories</h2>
          <p>Share your moments</p>
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

      <div className="story-create-section">
        <h3>Create Story</h3>
        <div className="create-form">
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="What's on your mind?"
            rows="3"
          />
          <div className="upload-actions">
            <button
              type="button"
              onClick={uploadStoryMedia}
              disabled={uploading}
              className="upload-btn"
            >
              <MdImage />
              {uploading ? "Uploading..." : "Upload Media"}
            </button>
            {storyMediaUrl && (
              <span className="media-uploaded">✓ Media uploaded</span>
            )}
          </div>
          {storyMediaUrl && (
            <div className="media-preview">
              <img src={storyMediaUrl} alt="Preview" />
            </div>
          )}
          <button
            type="button"
            onClick={createStory}
            className="post-btn"
            disabled={uploading}
          >
            <MdAddCircle />
            Post Story
          </button>
        </div>
      </div>

      <div className="stories-list overflow-y-scroll">
        <h3>All Stories</h3>
        {stories.length === 0 ? (
          <div className="empty-state">
            <p>No stories yet</p>
            <small>Be the first to share a story!</small>
          </div>
        ) : (
          <div className="stories-grid">
            {stories.map((story) => (
              <div
                key={story._id}
                className="story-card"
                onClick={() => viewStory(story)}
              >
                <div className="story-header">
                  <img
                    src={story.user?.pic || "https://via.placeholder.com/40"}
                    alt={story.user?.name}
                    className="story-avatar"
                  />
                  <div className="story-info">
                    <h4>
                      {story.user?._id === loggedUser?._id
                        ? "Your Story"
                        : story.user?.name}
                    </h4>
                    <small>{new Date(story.createdAt).toLocaleString()}</small>
                  </div>
                </div>
                {story.mediaUrl && (
                  <div className="story-media-thumb">
                    <img src={story.mediaUrl} alt="Story" />
                  </div>
                )}
                {story.text && (
                  <p className="story-text-preview">{story.text}</p>
                )}
                <div className="story-footer">
                  <span>{story.viewers?.length || 0} views</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeStory && (
        <div className="story-modal" onClick={() => setActiveStory(null)}>
          <div className="story-view" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="story-close"
              onClick={() => setActiveStory(null)}
            >
              <MdClose />
            </button>
            <div className="story-owner">
              <img
                src={activeStory.user?.pic || "https://via.placeholder.com/40"}
                alt={activeStory.user?.name}
              />
              <span>{activeStory.user?.name}</span>
            </div>
            {activeStory.mediaUrl && (
              <img
                className="story-media"
                src={activeStory.mediaUrl}
                alt="story"
              />
            )}
            {activeStory.text && <p className="story-text">{activeStory.text}</p>}
            <small className="story-views">
              {activeStory.viewers?.length || 0} views
            </small>
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

  .story-create-section {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
    
    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1rem;
    }
    
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      textarea {
        width: 100%;
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
        background-color: ${({ theme }) => theme.colors.bg.secondary};
        color: ${({ theme }) => theme.colors.heading};
        font-size: 0.9rem;
        resize: vertical;
        outline: none;
        
        &:focus {
          border-color: ${({ theme }) => theme.colors.primaryRgb};
        }
      }
      
      .upload-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .upload-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.1);
        color: ${({ theme }) => theme.colors.primaryRgb};
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.2);
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        svg {
          font-size: 1.2rem;
        }
      }
      
      .media-uploaded {
        color: #10b981;
        font-size: 0.85rem;
        font-weight: 600;
      }
      
      .media-preview {
        width: 100%;
        max-height: 200px;
        border-radius: 8px;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      .post-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        background-color: ${({ theme }) => theme.colors.primaryRgb};
        color: #fff;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        svg {
          font-size: 1.3rem;
        }
      }
    }
  }

  .stories-list {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    
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
    justify-content: center;
    padding: 3rem 1rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    text-align: center;
    
    p {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    
    small {
      opacity: 0.7;
    }
  }

  .stories-grid {
    display: grid;
    gap: 1rem;
  }

  .story-card {
    background-color: ${({ theme }) => theme.colors.bg.secondary};
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.2);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .story-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      
      .story-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid ${({ theme }) => theme.colors.primaryRgb};
      }
      
      .story-info {
        flex: 1;
        
        h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: ${({ theme }) => theme.colors.heading};
          margin-bottom: 0.15rem;
        }
        
        small {
          font-size: 0.75rem;
          color: ${({ theme }) => theme.colors.text.secondary};
        }
      }
    }
    
    .story-media-thumb {
      width: 100%;
      height: 150px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 0.75rem;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .story-text-preview {
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .story-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  .story-modal {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
  }

  .story-view {
    width: min(420px, 92vw);
    min-height: 520px;
    max-height: 90vh;
    position: relative;
    border-radius: 12px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    color: #fff;
    background: linear-gradient(145deg, #1f2937, #111827);
    overflow-y: auto;
    
    .story-close {
      position: absolute;
      right: 12px;
      top: 12px;
      font-size: 1.8rem;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: #fff;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.7);
      }
    }
    
    .story-owner {
      position: absolute;
      left: 16px;
      top: 16px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #fff;
      }
      
      span {
        font-weight: 600;
        font-size: 1rem;
      }
    }
    
    .story-media {
      max-height: 400px;
      max-width: 100%;
      object-fit: contain;
      border-radius: 8px;
      margin-top: 2rem;
    }
    
    .story-text {
      font-size: 1.1rem;
      text-align: center;
      line-height: 1.6;
      padding: 0 1rem;
    }
    
    .story-views {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .story-delete {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      background: #dc2626;
      color: #fff;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      
      &:hover {
        background: #b91c1c;
      }
    }
  }

  @media (max-width: 500px) {
    .story-create-section,
    .stories-list {
      padding: 1rem;
    }
    
    .story-card {
      padding: 0.75rem;
    }
  }
`;

export default Stories;

"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import "./ConversationList.css"

const ConversationList = ({ onConversationSelect, selectedConversationId }) => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState(null)

  // Use full URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/chatbot"

  // Memoize the loadConversations function
  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Loading conversations from:", `${API_BASE_URL}/conversations/`)

      const response = await axios.get(`${API_BASE_URL}/conversations/`, {
        withCredentials: true,
        timeout: 10000, // 10 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Conversations loaded successfully:", response.data)
      setConversations(response.data)
    } catch (error) {
      console.error("Error loading conversations:", error)

      let errorMessage = "Failed to load conversations"

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout - please check if the server is running"
      } else if (error.response) {
        // Server responded with error status
        errorMessage = `Server error: ${error.response.status} ${error.response.statusText}`
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Cannot connect to server. Please check if Django is running on http://localhost:8000"
      } else {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [API_BASE_URL])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const deleteConversation = async (conversationId, event) => {
    event.stopPropagation();

    // Show confirmation popup
    const confirmed = window.confirm("Are you sure you want to delete this conversation?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/conversations/${conversationId}/`, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // Ensure session is sent
      });

      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      if (selectedConversationId === conversationId) {
        onConversationSelect("");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/conversations/${conversationToDelete}/`, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationToDelete));
      if (selectedConversationId === conversationToDelete) {
        onConversationSelect("");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    } finally {
      setShowDeleteModal(false);
      setConversationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="conversation-list">
        <div className="loading-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-item"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="conversation-list">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Connection Error</p>
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={loadConversations}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="conversation-list">
      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>No conversations yet</p>
          <span>Start a new chat to begin</span>
        </div>
      ) : (
        <div className="conversations">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${selectedConversationId === conversation.id ? "selected" : ""}`}
              onClick={() => onConversationSelect(conversation.id)}
            >
              <div className="conversation-content">
                <h3 className="conversation-title">{conversation.title}</h3>
                {conversation.last_message && (
                  <p className="conversation-preview">{conversation.last_message.content}</p>
                )}
                <div className="conversation-meta">
                  <span className="conversation-date">{formatDate(conversation.updated_at)}</span>
                  <span className="conversation-count">{conversation.message_count} messages</span>
                </div>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setConversationToDelete(conversation.id);
                  setShowDeleteModal(true);
                }}
                title="Delete conversation"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Conversation</h3>
            <p>Are you sure you want to delete this conversation?</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleConfirmDelete}>Delete</button>
              <button className="btn btn-secondary" onClick={handleCancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationList

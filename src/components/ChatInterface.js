"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import "./ChatInterface.css"

const ChatInterface = ({ conversationId }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Use full URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/chatbot"

  // Memoize the loadMessages function to prevent unnecessary re-renders
  const loadMessages = useCallback(async () => {
    try {
      setIsInitializing(true)
      setError(null)

      console.log("Loading messages from:", `${API_BASE_URL}/conversations/${conversationId}/messages/list/`)

      const response = await axios.get(`${API_BASE_URL}/conversations/${conversationId}/messages/list/`, {
        timeout: 15000, // Increased timeout for initialization
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Messages loaded successfully:", response.data)
      setMessages(response.data.messages || [])
      setError(null)
    } catch (error) {
      console.error("Error loading messages:", error)

      let errorMessage = "Failed to load conversation"

      if (error.response) {
        // Server responded with error status
        console.error("Response error:", error.response.data)
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.error || error.response.statusText}`

        if (error.response.status === 400) {
          errorMessage = `Bad request: ${error.response.data?.error || "Invalid request format"}`
        } else if (error.response.status === 404) {
          // Conversation doesn't exist yet, that's okay - it will be created
          setMessages([])
          setError(null)
          return
        } else if (error.response.status === 500) {
          errorMessage = `Server error: ${error.response.data?.error || "Internal server error"}`
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Cannot connect to server. Please check if Django is running."
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout - server is taking too long to respond"
      } else {
        errorMessage = `Network error: ${error.message}`
      }

      setError(errorMessage)
    } finally {
      setIsInitializing(false)
    }
  }, [conversationId, API_BASE_URL])

  // Load messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadMessages()
    }
  }, [loadMessages, conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return

    setIsLoading(true)
    setError(null)

    // Create a temporary user message object
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      message_type: "user",
      content: inputMessage,
      image_url: imagePreview,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])
    setInputMessage("")
    removeImage()

    try {
      const formData = new FormData()
      formData.append("content", inputMessage)
      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      console.log("Sending message to:", `${API_BASE_URL}/conversations/${conversationId}/messages/`)
      console.log("Form data content:", inputMessage)
      console.log("Form data has image:", !!selectedImage)

      const response = await axios.post(`${API_BASE_URL}/conversations/${conversationId}/messages/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // 2 minutes for agent response
      })

      // Remove the temporary user message (if you want to replace it with the real one from backend)
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempUserMessage.id)
      )

      // Add both user and AI messages from backend
      const newMessages = []
      if (response.data.user_message) {
        newMessages.push(response.data.user_message)
      }
      if (response.data.ai_message) {
        newMessages.push(response.data.ai_message)
      }
      setMessages((prev) => [...prev, ...newMessages])

      // Handle agent error if any
      if (response.data.agent_error) {
        console.warn("Agent returned an error response:", response.data.agent_error_details)
      }
    } catch (error) {
      // Remove temp message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempUserMessage.id)
      )

      console.error("Error sending message:", error)

      let errorMessage = "Failed to send message"

      if (error.response) {
        // Server responded with error status
        console.error("Response error:", error.response.data)
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.error || error.response.statusText}`

        if (error.response.status === 400) {
          errorMessage = `Bad request: ${error.response.data?.error || "Invalid message format"}`
          if (error.response.data?.details) {
            errorMessage += ` - ${error.response.data.details}`
          }
        } else if (error.response.status === 500) {
          errorMessage = `Server error: ${error.response.data?.error || "Internal server error"}`
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Cannot connect to server. Please check if Django is running."
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout - the agent is taking too long to respond"
      } else {
        errorMessage = `Network error: ${error.message}`
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const retryLastAction = () => {
    setError(null)
    if (messages.length === 0) {
      loadMessages()
    }
  }

  if (isInitializing) {
    return (
      <div className="chat-interface">
        <div className="messages-container">
          <div className="initializing-message">
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">Initializing your Speaker Kit Assistant...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-interface">
      {/* Messages Area */}
      <div className="messages-container">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <span className="error-text">{error}</span>
              <button className="retry-btn" onClick={retryLastAction}>
                Retry
              </button>
            </div>
            <button className="close-error-btn" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoading && !error && (
          <div className="welcome-message">
            <div className="welcome-icon">🎤</div>
            <h3>Speaker Kit Assistant</h3>
            <p>Your assistant will help you build your speaker kit step by step!</p>
            <p className="welcome-subtitle">Starting with the cover page...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.message_type === "user" ? "message-user" : "message-ai"} ${
              message.content === "Something went wrong. Please try again." ? "message-error" : ""
            }`}
          >
            <div className="message-content">
              {message.image_url && (
                <div className="message-image">
                  <img src={message.image_url || "/placeholder.svg"} alt="Uploaded" />
                </div>
              )}
              <p className="message-text">{message.content}</p>
              <span className="message-time">{formatTimestamp(message.timestamp)}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message message-ai">
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">Speaker Kit Assistant is responding...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview || "/placeholder.svg"} alt="Preview" />
            <button className="remove-image-btn" onClick={removeImage}>
              ×
            </button>
          </div>
        )}

        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            disabled={isLoading}
            className="message-input"
          />

          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="file-input" />

          <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            📷
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={sendMessage}
            disabled={isInitializing || isLoading || (!inputMessage.trim() && !selectedImage)}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface

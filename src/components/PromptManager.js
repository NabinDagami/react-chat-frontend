"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import "./PromptManager.css"

const PromptManager = ({ onTopicSelect, onStarterSelect }) => {
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState("general")
  const [starters, setStarters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Use full URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/chatbot"

  const topicIcons = {
    general: "💬",
    learning: "💡",
    creative: "🎨",
    technology: "💻",
    problem_solving: "❓",
  }

  const topicColors = {
    general: "#3b82f6",
    learning: "#10b981",
    creative: "#8b5cf6",
    technology: "#f59e0b",
    problem_solving: "#ef4444",
  }

  // Memoize the loadTopics function
  const loadTopics = useCallback(async () => {
    try {
      console.log("Loading topics from:", `${API_BASE_URL}/conversation-starters/`)

      const response = await axios.get(`${API_BASE_URL}/conversation-starters/`, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Topics loaded successfully:", response.data)
      setTopics(response.data.available_topics || [])
      setError(null)
    } catch (error) {
      console.error("Error loading topics:", error)
      setError("Failed to load topics")
      // Set default topics if API fails
      setTopics(["general", "learning", "creative", "technology", "problem_solving"])
    }
  }, [API_BASE_URL])

  // Memoize the loadStarters function
  const loadStarters = useCallback(
    async (topic) => {
      setLoading(true)
      setError(null)

      try {
        console.log("Loading starters for topic:", topic)

        const response = await axios.get(`${API_BASE_URL}/conversation-starters/?topic=${topic}`, {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("Starters loaded successfully:", response.data)
        const startersList = response.data.starters.split("\n").filter((s) => s.trim())
        setStarters(startersList)
      } catch (error) {
        console.error("Error loading starters:", error)
        setError("Failed to load conversation starters")
        // Set default starters if API fails
        setStarters([
          "Hello! How can I help you today?",
          "What would you like to talk about?",
          "I'm here to assist you with any questions.",
        ])
      } finally {
        setLoading(false)
      }
    },
    [API_BASE_URL],
  )

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  useEffect(() => {
    if (selectedTopic) {
      loadStarters(selectedTopic)
    }
  }, [selectedTopic, loadStarters])

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    onTopicSelect(topic)
  }

  const handleStarterClick = (starter) => {
    onStarterSelect(starter)
  }

  return (
    <div className="prompt-manager">
      <div className="prompt-header">
        <h3>💬 Conversation Topics</h3>
        {error && (
          <div className="error-badge">
            <span>⚠️ {error}</span>
          </div>
        )}
      </div>

      <div className="prompt-content">
        {/* Topic Selection */}
        <div className="topic-section">
          <h4>Choose a topic:</h4>
          <div className="topic-grid">
            {topics.map((topic) => (
              <button
                key={topic}
                className={`topic-btn ${selectedTopic === topic ? "active" : ""}`}
                onClick={() => handleTopicSelect(topic)}
                style={{
                  "--topic-color": topicColors[topic] || "#6b7280",
                }}
              >
                <span className="topic-icon">{topicIcons[topic] || "💬"}</span>
                {topic.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Starters */}
        <div className="starters-section">
          <h4>Conversation starters:</h4>
          {loading ? (
            <div className="starters-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="starter-skeleton"></div>
              ))}
            </div>
          ) : (
            <div className="starters-grid">
              {starters.map((starter, index) => (
                <button key={index} className="starter-card" onClick={() => handleStarterClick(starter)}>
                  {starter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptManager

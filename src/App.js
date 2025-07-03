"use client"

import { useState } from "react"
import ChatInterface from "./components/ChatInterface"
import ConversationList from "./components/ConversationList"
import PromptManager from "./components/PromptManager"
import "./App.css"

function App() {
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showPromptManager, setShowPromptManager] = useState(false)

  const createNewConversation = () => {
    const newId = crypto.randomUUID()
    setSelectedConversationId(newId)
    setShowPromptManager(false)
  }

  const handleConversationSelect = (conversationId) => {
    setSelectedConversationId(conversationId)
    setShowPromptManager(false)
  }

  const handleTopicSelect = (topic) => {
    console.log("Selected topic:", topic)
  }

  const handleStarterSelect = (starter) => {
    console.log("Selected starter:", starter)
    setShowPromptManager(false)
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="sidebar-header">
          <button onClick={createNewConversation} className="btn btn-primary new-chat-btn">
            <span className="icon">+</span>
            New Chat
          </button>
        </div>
        <ConversationList
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversationId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <button className="btn btn-ghost sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
            <span className="icon">☰</span>
          </button>
          <h1 className="header-title">AI Chat Assistant</h1>
          {/* <button className="btn btn-outline" onClick={() => setShowPromptManager(!showPromptManager)}>
            <span className="icon">💡</span>
            Topics
          </button> */}
        </div>

        {showPromptManager && (
          <div className="prompt-manager-container">
            <PromptManager onTopicSelect={handleTopicSelect} onStarterSelect={handleStarterSelect} />
          </div>
        )}

        {/* Chat Interface */}
        <div className="chat-container">
          {selectedConversationId ? (
            <ChatInterface conversationId={selectedConversationId} />
          ) : (
            <div className="welcome-screen">
              <div className="welcome-content">
                <div className="welcome-icon">💬</div>
                <h2>Welcome to AI Chat</h2>
                <p>Select a conversation or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

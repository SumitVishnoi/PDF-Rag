
import { useState, useRef, useEffect } from "react";
import {
  PanelLeft,
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  Code2,
  Lightbulb,
  FileText,
  Globe,
  Mic,
  ArrowUp,
  ChevronDown,
  MoreHorizontal,
  Settings,
  LogOut,
  X,
  Menu,
  Paperclip,
} from "lucide-react";

const suggestions = [
  {
    icon: Code2,
    title: "Write code",
    description: "Build something with code",
    prompt: "Help me build a modern React application",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    description: "Explore ideas and possibilities",
    prompt: "Give me 5 creative AI project ideas",
  },
  {
    icon: FileText,
    title: "Write anything",
    description: "Emails, content and more",
    prompt: "Help me write a professional email",
  },
  {
    icon: Globe,
    title: "Learn something",
    description: "Explain a topic simply",
    prompt: "Explain how large language models work",
  },
];

const initialHistory = [
  { id: 1, title: "React authentication flow" },
  { id: 2, title: "Project ideas using AI" },
  { id: 3, title: "Understanding system design" },
  { id: 4, title: "Improve my resume" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [history, setHistory] = useState(initialHistory);
  const [model, setModel] = useState("My AI");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function newChat() {
    setMessages([]);
    setActiveChat(null);
    setInput("");
    setAttachedFile(null);
    setMobileSidebarOpen(false);
    inputRef.current?.focus();
  }

  function openChat(chat) {
    setActiveChat(chat.id);
    setMessages([]);
    setMobileSidebarOpen(false);
    setInput("");
  }

  function sendMessage(text = input) {
    const content = text.trim();
    if (!content && !attachedFile) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content:
        content +
        (attachedFile ? `\n📎 ${attachedFile.name}` : ""),
    };

    let chatId = activeChat;

    if (!chatId) {
      chatId = Date.now();
      setActiveChat(chatId);
      setHistory((prev) => [
        { id: chatId, title: content || attachedFile?.name || "New chat" },
        ...prev,
      ]);
    }

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null);

    // Demo response. Replace this with your AI API call.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content:
            "I'm your AI assistant! This is a UI demo. Connect your AI API to generate real responses to your questions.",
        },
      ]);
    }, 600);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const filteredHistory = history.filter((chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-[#252525]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col
          border-r border-black/[0.07] bg-[#f9f9f9]
          transition-transform duration-200
          md:relative md:z-auto md:translate-x-0
          ${sidebarOpen ? "md:flex md:w-[260px]" : "md:hidden"}
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between px-3">
          <button
            onClick={newChat}
            className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-black/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#222] text-white">
              <Sparkles size={18} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              My AI
            </span>
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              setMobileSidebarOpen(false);
            }}
            className="rounded-lg p-2 text-gray-500 hover:bg-black/5"
            aria-label="Close sidebar"
          >
            <PanelLeft size={19} />
          </button>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-1 px-3 pt-3">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-black/[0.06]"
          >
            <Plus size={18} />
            <span>New chat</span>
          </button>

          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setSearchTerm("");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-black/[0.06]"
          >
            <Search size={18} />
            <span>Search chats</span>
          </button>

          {searchOpen && (
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
            />
          )}
        </div>

        {/* Chat history */}
        <div className="mt-7 flex-1 overflow-y-auto px-3">
          <p className="mb-2 px-3 text-xs font-semibold text-gray-500">
            Your chats
          </p>

          <div className="space-y-1">
            {filteredHistory.map((chat) => (
              <div key={chat.id} className="group flex items-center gap-1">
                <button
                  onClick={() => openChat(chat)}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                    activeChat === chat.id
                      ? "bg-black/[0.07]"
                      : "hover:bg-black/[0.05]"
                  }`}
                >
                  <MessageSquare
                    size={16}
                    className="shrink-0 text-gray-500"
                  />
                  <span className="truncate">{chat.title}</span>
                </button>

                <button
                  aria-label="Delete chat"
                  title="Delete chat"
                  onClick={() => {
                    setHistory((prev) =>
                      prev.filter((item) => item.id !== chat.id)
                    );
                    if (activeChat === chat.id) newChat();
                  }}
                  className="mr-1 hidden rounded p-1.5 text-gray-500 hover:bg-black/10 group-hover:block"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
            {filteredHistory.length === 0 && (
              <p className="px-3 py-3 text-xs text-gray-500">
                No conversations found.
              </p>
            )}
          </div>
        </div>

        {/* Upgrade card */}
        <div className="mx-3 mb-3 rounded-xl border border-black/[0.07] bg-white p-3">
          <div className="flex items-center gap-2">
            <Sparkles size={17} />
            <span className="text-sm font-medium">More with AI</span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-gray-500">
            Explore smarter ways to get things done.
          </p>
          <button className="mt-3 w-full rounded-lg bg-[#252525] py-2 text-xs font-medium text-white hover:bg-black/80">
            Explore features
          </button>
        </div>

        {/* User profile */}
        <div className="relative border-t border-black/[0.07] p-3">
          {profileMenuOpen && (
            <div className="absolute bottom-[70px] left-3 right-3 rounded-xl border border-black/10 bg-white p-1.5 shadow-xl">
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
                <Settings size={16} /> Settings
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}

          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-black/[0.05]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9e6dc] text-sm font-semibold text-[#284c36]">
              SV
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Your account</p>
              <p className="text-xs text-gray-500">Free plan</p>
            </div>
            <MoreHorizontal size={18} className="text-gray-500" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex min-w-0 flex-1 flex-col bg-white">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between px-3 sm:px-5">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden rounded-lg p-2 hover:bg-gray-100 md:block"
                aria-label="Open sidebar"
              >
                <PanelLeft size={19} />
              </button>
            )}

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[15px] font-semibold hover:bg-gray-100"
              >
                {model}
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {modelMenuOpen && (
                <div className="absolute left-0 top-12 z-30 w-56 rounded-xl border border-black/10 bg-white p-1.5 shadow-lg">
                  {["My AI", "My AI Fast", "My AI Thinking"].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setModel(item);
                        setModelMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-gray-100"
                    >
                      {item}
                      {model === item && (
                        <span className="text-xs text-gray-500">Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs font-medium hover:bg-gray-50 sm:text-sm">
            <Sparkles size={15} />
            <span>Share</span>
          </button>
        </header>

        {/* Conversation area */}
        <section className="flex min-h-0 flex-1 flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 pb-5">
              <div className="w-full max-w-[720px]">
                <div className="mb-8 text-center sm:mb-10">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm">
                    <Sparkles size={23} strokeWidth={1.7} />
                  </div>
                  <h1 className="text-[27px] font-semibold tracking-tight sm:text-[32px]">
                    What can I help with?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Ask anything. Let's figure it out together.
                  </p>
                </div>

                {/* Suggestion cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        onClick={() => sendMessage(item.prompt)}
                        className="group rounded-2xl border border-black/[0.09] p-4 text-left transition hover:border-black/20 hover:bg-[#fafafa]"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Icon
                            size={20}
                            strokeWidth={1.7}
                            className="text-gray-600"
                          />
                          <ArrowUp
                            size={16}
                            className="text-gray-400 opacity-0 transition group-hover:opacity-100"
                          />
                        </div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mx-auto max-w-[760px] space-y-7">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-[#f4f4f4] px-4 py-3 text-[15px] leading-7 sm:max-w-[75%]">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/10">
                          <Sparkles size={17} />
                        </div>
                        <div className="min-w-0 flex-1 pt-1 text-[15px] leading-7">
                          <p className="mb-1 font-semibold">My AI</p>
                          <p className="whitespace-pre-wrap text-[#333]">
                            {message.content}
                          </p>
                          <div className="mt-3 flex gap-1 text-gray-500">
                            <button
                              title="Copy response"
                              onClick={() =>
                                navigator.clipboard?.writeText(message.content)
                              }
                              className="rounded-lg p-2 hover:bg-gray-100"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              title="More options"
                              className="rounded-lg p-2 hover:bg-gray-100"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
            <div className="mx-auto max-w-[760px]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="rounded-[26px] border border-black/[0.12] bg-white px-3 pt-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition focus-within:border-black/25 focus-within:shadow-[0_3px_14px_rgba(0,0,0,0.07)] sm:px-4"
              >
                {attachedFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs">
                    <Paperclip size={14} />
                    <span className="flex-1 truncate">
                      {attachedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      aria-label="Remove attachment"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message My AI..."
                  aria-label="Message My AI"
                  className="max-h-40 min-h-[42px] w-full resize-none bg-transparent px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-gray-400"
                />

                <div className="flex items-center justify-between gap-2 pb-1.5">
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setAttachedFile(e.target.files?.[0] || null)
                      }
                    />
                    <button
                      type="button"
                      title="Attach file"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                    >
                      <Plus size={21} />
                    </button>

                    <button
                      type="button"
                      className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 sm:flex"
                    >
                      <Globe size={15} />
                      Search
                    </button>
                    <button
                      type="button"
                      className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 sm:flex"
                    >
                      <Lightbulb size={15} />
                      Think
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Voice input"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                    >
                      <Mic size={19} />
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim() && !attachedFile}
                      aria-label="Send message"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#252525] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-gray-400"
                    >
                      <ArrowUp size={19} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </form>

              <p className="mt-3 text-center text-[10px] leading-4 text-gray-500 sm:text-[11px]">
                AI can make mistakes. Check important information.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

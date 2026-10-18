import { useRef, useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowUp,
  Check,
  ChevronDown,
  FileText,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useChat } from "../hook/useChat";

const suggestions = [
  "Summarize this document",
  "What are the main points?",
  "Explain the key terms",
];

function formatBytes(bytes) {
  if (!bytes) return "PDF document";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error, action) {
  const message = error.response?.data?.message;

  if (!error.response) {
    if (!error.isAxiosError && error.message) return error.message;
    return "Could not reach the PDF service. Check that the backend is running and try again.";
  }

  if (message === "Document is still being processed") {
    return "Your PDF is still being prepared. Please wait a moment and try again.";
  }

  if (message === "Document not found") {
    return "This PDF is no longer available. Upload it again to continue.";
  }

  if (message === "No relevant information found in this document" ||
      message === "No relevant text found in this document") {
    return "I couldn’t find information about that in this PDF. Try asking in a different way.";
  }

  if (message === "Could not extract text from this PDF") {
    return "I couldn’t read any text in this PDF. It may be a scanned document without selectable text.";
  }

  if (message === "Only PDF files are allowed" || message === "No PDF file uploaded") {
    return "Please choose a PDF file to upload.";
  }

  return message || `Something went wrong while ${action}. Please try again.`;
}

function MarkdownAnswer({ content }) {
  const html = DOMPurify.sanitize(
    marked.parse(content, { breaks: true, gfm: true }),
  );

  return (
    <div
      className="markdown-answer"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function Dashboard() {
  const [documentInfo, setDocumentInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const questionInputRef = useRef(null);
  const bottomRef = useRef(null);
  const { uploadDocument, askQuestion } = useChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, asking]);

  async function handleFile(file) {
    if (!file || uploading || asking) return;

    const isPdf = file.type === "application/pdf" ||
      (!file.type && file.name.toLowerCase().endsWith(".pdf"));
    if (!isPdf || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file to get started.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const result = await uploadDocument(file);
      if (!result.success || !result.data?.documentId) {
        throw new Error(result.message || "The PDF could not be prepared.");
      }

      setDocumentInfo({
        documentId: result.data.documentId,
        fileName: result.data.fileName || file.name,
        totalChunks: result.data.totalChunks,
        size: file.size,
      });
      setMessages([]);
      setQuestion("");
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "preparing your PDF"));
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void handleFile(file);
  }

  async function sendQuestion(text = question) {
    const cleanQuestion = text.trim();
    if (!cleanQuestion || !documentInfo || asking || uploading) return;

    setError("");
    setQuestion("");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: cleanQuestion,
      },
    ]);
    setAsking(true);

    try {
      const result = await askQuestion({
        documentId: documentInfo.documentId,
        question: cleanQuestion,
      });
      if (!result.success || !result.data?.answer) {
        throw new Error(result.message || "The answer was empty.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.data.answer,
          sources: result.data.sources || [],
        },
      ]);
    } catch (askError) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: getErrorMessage(askError, "answering your question"),
          isError: true,
        },
      ]);
    } finally {
      setAsking(false);
      questionInputRef.current?.focus();
    }
  }

  function startNewDocument() {
    setDocumentInfo(null);
    setMessages([]);
    setQuestion("");
    setError("");
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  const canAsk = Boolean(
    documentInfo && question.trim() && !asking && !uploading,
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="PDF Companion home">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span>PDF Companion</span>
        </a>

        <div className="topbar-actions">
          {documentInfo && (
            <button
              className="button button-subtle new-document-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || asking}
            >
              <Upload size={16} />
              <span>Upload another PDF</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileInput}
            aria-label="Choose a PDF file"
          />
          <span className="privacy-note">
            <Check size={14} /> Answers grounded in your PDF
          </span>
        </div>
      </header>

      <main className={`workspace${documentInfo ? " workspace-chat" : ""}`}>
        {error && (
          <div className="alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              className="icon-button alert-dismiss"
              onClick={() => setError("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {uploading && documentInfo && (
          <div className="processing-banner" role="status">
            <LoaderCircle className="spin" size={16} />
            Preparing the new PDF. Your current document will stay available if
            the upload doesn’t complete.
          </div>
        )}

        {!documentInfo ? (
          <section className="welcome-panel" aria-labelledby="welcome-title">
            <div className="eyebrow"><Sparkles size={15} /> ASK YOUR DOCUMENT</div>
            <h1 id="welcome-title">Get to know your PDF.</h1>
            <p className="welcome-copy">
              Upload a document, then ask questions in plain language. Answers
              are based on the contents of your PDF.
            </p>

            <button
              className={`upload-dropzone${dragActive ? " drag-active" : ""}`}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDragActive(false);
                }
              }}
              onDrop={handleDrop}
              disabled={uploading}
              aria-label="Choose or drop a PDF to upload"
            >
              <span className="upload-icon">
                {uploading ? (
                  <LoaderCircle className="spin" size={24} />
                ) : (
                  <Upload size={24} />
                )}
              </span>
              <span className="upload-title">
                {uploading ? "Preparing your PDF…" : "Drop your PDF here"}
              </span>
              <span className="upload-copy">
                {uploading
                  ? "Uploading, extracting text, and getting it ready to search."
                  : "or click to browse your files"}
              </span>
              {!uploading && <span className="file-type-note">PDF files only</span>}
            </button>

            <div className="how-it-works">
              <div><span>1</span> Upload a PDF</div>
              <div><span>2</span> Ask a question</div>
              <div><span>3</span> Explore a cited answer</div>
            </div>
          </section>
        ) : (
          <section className="chat-workspace" aria-label="PDF conversation">
            <div className="document-card">
              <div className="document-icon"><FileText size={20} /></div>
              <div className="document-details">
                <p className="document-name" title={documentInfo.fileName}>
                  {documentInfo.fileName}
                </p>
                <p className="document-meta">
                  {formatBytes(documentInfo.size)}
                  {documentInfo.totalChunks
                    ? ` · Ready to search · ${documentInfo.totalChunks} sections`
                    : " · Ready to search"}
                </p>
              </div>
              <span className="ready-badge"><Check size={13} /> Ready</span>
              <button
                type="button"
                className="icon-button remove-document"
                onClick={startNewDocument}
                disabled={uploading || asking}
                aria-label="Close this PDF"
                title="Close this PDF"
              >
                <X size={18} />
              </button>
            </div>

            <div className="conversation">
              {messages.length === 0 ? (
                <div className="empty-conversation">
                  <div className="assistant-mark"><Sparkles size={19} /></div>
                  <h1>What would you like to know?</h1>
                  <p>Ask a question about <strong>{documentInfo.fileName}</strong>.</p>
                  <div className="suggestion-list">
                    {suggestions.map((suggestion) => (
                      <button
                        type="button"
                        className="suggestion-chip"
                        key={suggestion}
                        onClick={() => void sendQuestion(suggestion)}
                        disabled={asking}
                      >
                        <MessageCircle size={15} />
                        {suggestion}
                        <ArrowUp size={14} className="suggestion-arrow" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message) => (
                    <article
                      className={`message message-${message.role}`}
                      key={message.id}
                    >
                      {message.role === "assistant" && (
                        <div className="assistant-mark message-mark">
                          <Sparkles size={16} />
                        </div>
                      )}
                      <div className="message-body">
                        {message.role === "user" ? (
                          <div className="user-bubble">{message.content}</div>
                        ) : (
                          <>
                            <div className="message-author">
                              {message.isError ? "Couldn’t answer" : "PDF Companion"}
                            </div>
                            <div className={message.isError ? "answer-error" : ""}>
                              {message.isError
                                ? message.content
                                : <MarkdownAnswer content={message.content} />}
                            </div>
                            {message.sources?.length > 0 && (
                              <details className="sources">
                                <summary>
                                  <FileText size={14} />
                                  {message.sources.length} document
                                  {message.sources.length === 1 ? " section" : " sections"} used
                                  <ChevronDown size={14} />
                                </summary>
                                <div className="source-list">
                                  {message.sources.map((source, index) => (
                                    <div className="source-item" key={`${source.chunkIndex}-${index}`}>
                                      <span className="source-label">
                                        Section {source.chunkIndex ?? index + 1}
                                      </span>
                                      <p>{source.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                  {asking && (
                    <div className="message message-assistant" aria-live="polite">
                      <div className="assistant-mark message-mark"><Sparkles size={16} /></div>
                      <div className="message-body">
                        <div className="message-author">PDF Companion</div>
                        <div className="thinking-indicator">
                          <LoaderCircle className="spin" size={16} />
                          Looking through your document…
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="composer-wrap">
              <form
                className="composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendQuestion();
                }}
              >
                <textarea
                  ref={questionInputRef}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendQuestion();
                    }
                  }}
                  placeholder="Ask a question about this PDF…"
                  aria-label="Ask a question about this PDF"
                  rows={1}
                  disabled={uploading || asking}
                />
                <div className="composer-footer">
                  <span><Paperclip size={14} /> Answers use this document only</span>
                  <button
                    type="submit"
                    className="send-button"
                    disabled={!canAsk}
                    aria-label={asking ? "Getting answer" : "Send question"}
                    title="Send question"
                  >
                    {asking ? <LoaderCircle className="spin" size={17} /> : <ArrowUp size={18} />}
                  </button>
                </div>
              </form>
              <p className="composer-disclaimer">
                AI can make mistakes. Check important details against your PDF.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

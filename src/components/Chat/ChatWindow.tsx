import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Smile } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatWindowProps {
  roomName?: string;
  messages?: Message[];
  onSendMessage?: (text: string) => void;
}

// Mock data for UI demonstration
const mockMessages: Message[] = [
  {
    id: "1",
    text: "Hello everyone! How's it going?",
    sender: "John Doe",
    timestamp: new Date(Date.now() - 3600000),
    isOwn: false,
  },
  {
    id: "2",
    text: "Hey! Doing great, thanks for asking!",
    sender: "You",
    timestamp: new Date(Date.now() - 3300000),
    isOwn: true,
  },
  {
    id: "3",
    text: "Anyone working on the new feature?",
    sender: "Jane Smith",
    timestamp: new Date(Date.now() - 3000000),
    isOwn: false,
  },
  {
    id: "4",
    text: "Yes, I'm working on it. Should be ready by tomorrow.",
    sender: "You",
    timestamp: new Date(Date.now() - 2700000),
    isOwn: true,
  },
  {
    id: "5",
    text: "That's great! Looking forward to seeing it.",
    sender: "Mike Johnson",
    timestamp: new Date(Date.now() - 2400000),
    isOwn: false,
  },
];

export default function ChatWindow({
  roomName = "General",
  messages = mockMessages,
  onSendMessage,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Common emojis
  const commonEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "💪",
    "❤️",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
  ];

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  const handleEmojiClick = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {roomName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {messages.length} messages
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${
                message.isOwn ? "justify-end" : "justify-start"
              }`}>
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  message.isOwn
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                }`}>
                {!message.isOwn && (
                  <p className="text-sm font-medium mb-2 opacity-80">
                    {message.sender}
                  </p>
                )}
                <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                  {message.text}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    message.isOwn
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 relative">
            <button
              className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              aria-label="Attach file">
              <Paperclip className="w-6 h-6" />
            </button>
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-3 rounded-xl transition-colors ${
                  showEmojiPicker
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                aria-label="Add emoji">
                <Smile className="w-6 h-6" />
              </button>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 z-50">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Emojis
                      </h4>
                    </div>
                    <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto chat-scrollbar">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiClick(emoji)}
                          className="p-2 text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target"
                          aria-label={`Select emoji ${emoji}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={2}
              className="w-full px-5 py-4 pr-14 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-40 overflow-y-auto text-base leading-relaxed"
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`h-[52px] px-4 rounded-xl transition-colors flex items-center justify-center flex-shrink-0 ${
              inputValue.trim()
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
            aria-label="Send message">
            <Send className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

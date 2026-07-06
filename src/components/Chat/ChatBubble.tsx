import { useState } from "react";
import ChatLauncher from "./ChatLauncher";
import ChatPanel from "./ChatPanel";

interface ChatBubbleProps {
  variant?: "white" | "dark";
}

export default function ChatBubble({ variant = "white" }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ChatLauncher
        isOpen={isOpen}
        onClick={toggleChat}
        variant={variant}
      />
      <ChatPanel isOpen={isOpen} onClose={closeChat} variant={variant} />
    </>
  );
}


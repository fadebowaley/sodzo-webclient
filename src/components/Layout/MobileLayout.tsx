import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import MobileHeader from "./MobileHeader";
import BottomNavigation from "./BottomNavigation";
import Sidebar from "./Sidebar";
import MoreDrawer from "../Mobile/MoreDrawer";
import { ChatBubble } from "../Chat";

export default function MobileLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} showBack={false} />

      {/* Mobile Sidebar (Drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* More Drawer */}
      <MoreDrawer
        isOpen={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20 safe-area-content">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="min-h-full">
          {/* Content padding - responsive */}
          <div className="p-4 max-w-full">
            <Outlet />
          </div>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation onMoreClick={() => setMoreDrawerOpen(true)} />

      {/* Chat Bubble - Fixed bottom right (above bottom nav) */}
      <ChatBubble variant="white" />
    </div>
  );
}

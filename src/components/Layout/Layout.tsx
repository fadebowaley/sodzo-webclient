import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useDeviceDetection } from "../../hooks/useDeviceDetection";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileLayout from "./MobileLayout";
import { ChatBubble } from "../Chat";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const location = useLocation();
  const { isMobile } = useDeviceDetection();

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Render mobile layout for mobile devices
  if (isMobile) {
    return <MobileLayout />;
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar - Collapsible on desktop */}
      <div
        className={`hidden lg:block lg:flex-shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        }`}>
        <Sidebar
          isOpen={true}
          onClose={() => {}}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar (for tablet sizes) */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <motion.div
            className="p-6 max-w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}>
              <Outlet />
            </motion.div>
          </motion.div>
        </main>
      </div>
      {/* Chat Bubble - Fixed bottom right */}
      <ChatBubble variant="white" />
    </div>
  );
}

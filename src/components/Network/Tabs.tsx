import { ReactNode } from "react";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

interface TabListProps {
  children: ReactNode;
}

interface TabProps {
  value: string;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface TabPanelsProps {
  children: ReactNode;
}

interface TabPanelProps {
  value: string;
  active?: boolean;
  children: ReactNode;
}

export function Tabs({ activeTab, onTabChange, children }: TabsProps) {
  return <div className="w-full">{children}</div>;
}

export function TabList({ children }: TabListProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
      {children}
    </div>
  );
}

export function Tab({ value, children, active, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium transition-colors
        border-b-2 -mb-px
        ${
          active
            ? "border-blue-500 text-blue-600 dark:text-blue-400"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
        }
      `}>
      {children}
    </button>
  );
}

export function TabPanels({ children }: TabPanelsProps) {
  return <div>{children}</div>;
}

export function TabPanel({ value, active, children }: TabPanelProps) {
  if (!active) return null;
  return <div>{children}</div>;
}

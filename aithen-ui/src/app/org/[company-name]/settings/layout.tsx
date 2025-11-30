import SettingsNavigation from "@/components/navigation/settings-navigation";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <SettingsNavigation />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ChecklistenProvider } from "@/components/verwaltung/ChecklistenContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChecklistenProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-background">
        <Sidebar />
        <div className="flex-1 xl:ml-[260px] lg:ml-[220px] md:ml-[220px] flex flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-4 lg:p-4 xl:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ChecklistenProvider>
  );
}


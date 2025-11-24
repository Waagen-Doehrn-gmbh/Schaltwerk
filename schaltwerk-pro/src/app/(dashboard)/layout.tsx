import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarProvider } from "@/components/dashboard/SidebarContext";
import { ChecklistenProvider } from "@/components/verwaltung/ChecklistenContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChecklistenProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-slate-50 dark:bg-background">
          <Sidebar />
          <div className="flex-1 lg:ml-[220px] xl:ml-[260px] flex flex-col w-full">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-4 md:p-4 lg:p-4 xl:p-8">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ChecklistenProvider>
  );
}


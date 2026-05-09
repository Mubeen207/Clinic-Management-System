import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "react-hot-toast";

export function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 print:block print:h-auto print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden print:block print:overflow-visible">
        <div className="print:hidden">
          <Topbar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

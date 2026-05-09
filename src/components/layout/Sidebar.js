import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/src/context/AuthContext";
import { cn } from "@/src/utils/cn";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Stethoscope,
  MessageSquare,
  Megaphone,
  AlertTriangle
} from "lucide-react";

const getNavigation = (role) => {
  const baseNav = [
    { name: "Dashboard", href: `/dashboard/${role === "admin" ? "Admin" : role === "doctor" ? "Doctor" : role === "accountant" ? "Accountant" : "Staff"}Dashboard`, icon: LayoutDashboard },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Announcements", href: "/announcements", icon: Megaphone },
    { name: "Appointments", href: "/appointments/list", icon: Calendar },
    { name: "Patients", href: "/patients/listPatients", icon: Users },
  ];

  if (role === "admin") {
    return [
      ...baseNav,
      { name: "Doctors", href: "/doctors/list", icon: Stethoscope },
      { name: "Staff", href: "/staff/list", icon: Users },
      { name: "Complaints", href: "/complaints", icon: AlertTriangle },
      { name: "Billing", href: "/billing", icon: CreditCard },
      { name: "Reports", href: "/reports", icon: FileText },
    ];
  }

  if (role === "doctor") {
    return [
      ...baseNav,
      { name: "My Schedule", href: "/schedule", icon: Calendar },
      { name: "Prescriptions", href: "/prescriptions", icon: FileText },
      { name: "Complaints", href: "/complaints", icon: AlertTriangle },
    ];
  }

  if (role === "accountant") {
    return [
      { name: "Dashboard", href: "/dashboard/AccountantDashboard", icon: LayoutDashboard },
      { name: "Messages", href: "/messages", icon: MessageSquare },
      { name: "Announcements", href: "/announcements", icon: Megaphone },
      { name: "Billing", href: "/billing", icon: CreditCard },
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Complaints", href: "/complaints", icon: AlertTriangle },
    ];
  }

  // staff
  return [
    ...baseNav,
    { name: "Complaints", href: "/complaints", icon: AlertTriangle },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];
};

export function Sidebar() {
  const router = useRouter();
  const { role, logout } = useAuth();
  
  if (!role) return null;
  
  const navigation = getNavigation(role);

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Stethoscope className="h-6 w-6" />
          <span>CareClinic</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = router.pathname.startsWith(item.href.split('?')[0]);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={logout}
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" />
          Logout
        </button>
      </div>
    </div>
  );
}

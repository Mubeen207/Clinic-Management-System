import { Bell, Search, UserCircle } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";

export function Topbar() {
  const { user, role } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center">
        <div className="w-full max-w-md">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Search patients, appointments..."
              type="search"
            />
          </div>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-4 md:ml-6">
        <button className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="relative ml-3 flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-gray-700">{user?.name || user?.email}</span>
            <span className="text-xs text-gray-500 capitalize">{role}</span>
          </div>
          <button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <span className="sr-only">Open user menu</span>
            <UserCircle className="h-8 w-8 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}

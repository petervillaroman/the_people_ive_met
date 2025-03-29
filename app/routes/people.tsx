import { Outlet } from "@remix-run/react";

export default function PeopleLayout() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">People I&apos;ve Met</h1>
      <Outlet />
    </div>
  );
} 
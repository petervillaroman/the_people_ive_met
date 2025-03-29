import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "the people i've met landing page" },
    { name: "description", content: "maybe a short description of what this website is about" },
  ];
};

export default function Index() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">People I've Met</h1>
      
      <Link 
        to="/addNew"
        className="bg-black text-white px-4 py-2 rounded inline-block hover:bg-gray-800"
      >
        Add New Person
      </Link>
      
      {/* Rest of your index page content */}
    </div>
  );
}
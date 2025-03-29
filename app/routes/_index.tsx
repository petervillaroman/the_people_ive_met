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
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-6 text-center text-black">The People I&apos;ve Met</h1>
      <p className="text-lg text-high-contrast max-w-2xl text-center mb-8">
        A personal collection of all the interesting people I&apos;ve encountered on my journey through life.
      </p>
      
      <div className="space-y-4 flex flex-col items-center">
        <Link
          to="/people"
          className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-lg inline-block min-w-48 text-center"
        >
          View All People
        </Link>
        
        <Link
          to="/people/new"
          className="border border-black hover:bg-gray-100 text-black px-6 py-3 rounded-lg text-lg inline-block min-w-48 text-center"
        >
          Add New Person
        </Link>
      </div>
    </div>
  );
}
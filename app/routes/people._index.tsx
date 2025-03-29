import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { supabase } from "~/utils/supabase.server";

type Person = {
  id: string;
  name: string;
  photo_url: string | null;
  location: string | null;
  date_met: string | null;
  created_at: string | null;
};

export async function loader() {
  const { data, error } = await supabase
    .from("people")
    .select("id, name, photo_url, location, date_met, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching people:", error);
    return json({ people: [] as Person[] });
  }

  return json({ people: (data || []) as Person[] });
}

export default function PeopleIndex() {
  const { people } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All People</h2>
        <Link
          to="/people/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Add New Person
        </Link>
      </div>

      {people.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No people added yet. Add your first person!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((person) => (
            <Link
              key={person.id}
              to={`/people/${person.id}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                {person.photo_url ? (
                  <img
                    src={person.photo_url}
                    alt={person.name}
                    className="object-cover w-full h-48"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-200">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-black">{person.name}</h3>
                {person.location && (
                  <p className="text-gray-600 text-sm">{person.location}</p>
                )}
                {person.date_met && (
                  <p className="text-gray-500 text-xs mt-2">
                    Met on {new Date(person.date_met).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 
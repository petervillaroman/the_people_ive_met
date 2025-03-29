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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-high-contrast mb-4 sm:mb-0">All People I&apos;ve Met</h2>
        <Link
          to="/people/new"
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg w-full sm:w-auto text-center"
        >
          Add New Person
        </Link>
      </div>

      {people.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-medium-contrast text-lg">No people added yet. Add your first person!</p>
        </div>
      ) : (
        <div className="eclectic-grid">
          {people.map((person) => (
            <Link
              key={person.id}
              to={`/people/${person.id}`}
              className="border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col h-full"
            >
              <div className="aspect-w-4 aspect-h-3 bg-gray-100">
                {person.photo_url ? (
                  <img
                    src={person.photo_url}
                    alt={person.name}
                    className="object-cover w-full h-64 photo-bw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-200">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow">
                <h3 className="font-bold text-lg text-red-400">{person.name}</h3>
                {person.location && (
                  <p className="text-black text-sm mt-1">{person.location}</p>
                )}
                {person.date_met && (
                  <p className="text-black text-xs mt-2">
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
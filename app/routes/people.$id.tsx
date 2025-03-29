import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useSubmit } from "@remix-run/react";
import { supabase } from "~/utils/supabase.server";

type Person = {
  id: string;
  name: string;
  photo_url: string | null;
  location: string | null;
  context: string | null;
  their_story: string | null;
  date_met: string | null;
  created_at: string | null;
  message_to_the_world: string | null;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }
  
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error || !data) {
    throw new Response("Not Found", { status: 404 });
  }
  
  return json({ person: data as Person });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  
  if (!id) {
    return json({ error: "Person ID is required" }, { status: 400 });
  }
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "delete") {
    // First, get the photo URL to delete from storage if it exists
    const { data: person } = await supabase
      .from("people")
      .select("photo_url")
      .eq("id", id)
      .single();
    
    // Delete the record
    const { error: deleteError } = await supabase
      .from("people")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      return json({ error: `Failed to delete: ${deleteError.message}` }, { status: 500 });
    }
    
    // If there was a photo, extract filename and delete from storage
    if (person?.photo_url) {
      try {
        const urlParts = person.photo_url.split("/");
        const filename = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from("portraits")
          .remove([filename]);
      } catch (error) {
        // Continue even if photo deletion fails
        console.error("Failed to delete photo:", error);
      }
    }
    
    return redirect("/people");
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function PersonDetails() {
  const { person } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this person? This action cannot be undone.")) {
      const formData = new FormData();
      formData.append("intent", "delete");
      submit(formData, { method: "post" });
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <a
          href="/people"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to all people
        </a>
        <div className="flex gap-2">
          <a
            href={`/people/${person.id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Edit
          </a>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            {person.photo_url ? (
              <img
                src={person.photo_url}
                alt={person.name}
                className="w-full h-64 md:h-auto object-cover"
              />
            ) : (
              <div className="bg-gray-200 w-full h-64 md:h-full flex items-center justify-center">
                <span className="text-gray-400">No photo</span>
              </div>
            )}
          </div>
          
          <div className="p-6 md:w-2/3">
            <h1 className="text-2xl font-bold mb-4">{person.name}</h1>
            
            <div className="space-y-4">
              {person.location && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Location</h3>
                  <p>{person.location}</p>
                </div>
              )}
              
              {person.context && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">How We Met</h3>
                  <p>{person.context}</p>
                </div>
              )}
              
              {person.date_met && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Date Met</h3>
                  <p>{formatDate(person.date_met)}</p>
                </div>
              )}
              
              {person.their_story && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Their Story</h3>
                  <p className="whitespace-pre-line">{person.their_story}</p>
                </div>
              )}
              
              {person.message_to_the_world && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Message to the World</h3>
                  <p className="italic">&ldquo;{person.message_to_the_world}&rdquo;</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Added on</h3>
                <p>{formatDate(person.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Form method="post" className="hidden">
        <input type="hidden" name="intent" value="delete" />
      </Form>
    </div>
  );
} 
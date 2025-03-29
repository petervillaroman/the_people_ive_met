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
    <div className="bg-white shadow-lg rounded-lg overflow-hidden p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <a
          href="/people"
          className="text-black hover:text-gray-700 font-medium flex items-center mb-4 sm:mb-0"
        >
          ← Back to all people
        </a>
        <div className="flex gap-2 w-full sm:w-auto">
          <a
            href={`/people/${person.id}/edit`}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-center flex-1 sm:flex-initial"
          >
            Edit
          </a>
          <button
            onClick={handleDelete}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg flex-1 sm:flex-initial"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/5 lg:w-1/3 mb-6 md:mb-0 md:mr-6">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={person.name}
              className="w-full h-auto object-cover rounded-lg shadow-md photo-bw"
              style={{ maxHeight: '400px' }}
            />
          ) : (
            <div className="bg-gray-200 w-full h-64 md:h-64 flex items-center justify-center rounded-lg">
              <span className="text-gray-400">No photo</span>
            </div>
          )}
        </div>
        
        <div className="md:w-3/5 lg:w-2/3">
          <h1 className="text-3xl font-bold mb-6 text-black">{person.name}</h1>
          
          <div className="space-y-6">
            {person.location && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-2">Location</h3>
                <p className="text-high-contrast">{person.location}</p>
              </div>
            )}
            
            {person.context && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-2">How We Met</h3>
                <p className="text-high-contrast">{person.context}</p>
              </div>
            )}
            
            {person.date_met && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-2">Date Met</h3>
                <p className="text-high-contrast">{formatDate(person.date_met)}</p>
              </div>
            )}
            
            {person.their_story && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-2">Their Story</h3>
                <p className="whitespace-pre-line text-high-contrast">{person.their_story}</p>
              </div>
            )}
            
            {person.message_to_the_world && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-2">Message to the World</h3>
                <p className="italic text-high-contrast">&ldquo;{person.message_to_the_world}&rdquo;</p>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-black mb-2">Added on</h3>
              <p className="text-high-contrast">{formatDate(person.created_at)}</p>
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
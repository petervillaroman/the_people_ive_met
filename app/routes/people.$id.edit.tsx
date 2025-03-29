import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { supabase } from "~/utils/supabase.server";
import { compressImage } from "~/utils/imageCompression";
import { useState, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";

type Person = {
  id: string;
  name: string;
  photo_url: string | null;
  location: string | null;
  context: string | null;
  their_story: string | null;
  date_met: string | null;
  message_to_the_world: string | null;
};

type ActionData = {
  error?: string;
  fieldErrors?: Record<string, string>;
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
  
  // Get form values
  const name = formData.get("name")?.toString();
  const location = formData.get("location")?.toString() || null;
  const context = formData.get("context")?.toString() || null;
  const their_story = formData.get("their_story")?.toString() || null;
  const date_met = formData.get("date_met")?.toString() || null;
  const message_to_the_world = formData.get("message_to_the_world")?.toString() || null;
  const photo = formData.get("photo") as File | null;
  const compressedPhoto = formData.get("compressedPhoto") as File | null;
  const keepExistingPhoto = formData.get("keepExistingPhoto") === "true";
  
  // Use the compressed photo if it exists, otherwise use the original
  const photoToUpload = compressedPhoto || photo;
  
  // Validate required fields
  const errors: Record<string, string> = {};
  
  if (!name) errors.name = "Name is required";
  
  if (Object.keys(errors).length > 0) {
    return json({ fieldErrors: errors });
  }
  
  // Prepare update data
  const updateData: Partial<Person> = {
    name,
    location,
    context,
    their_story,
    date_met,
    message_to_the_world,
  };
  
  // Handle photo if a new one is provided
  if (photoToUpload && photoToUpload.size > 0) {
    // Get existing photo URL to delete later
    const { data: existingPerson } = await supabase
      .from("people")
      .select("photo_url")
      .eq("id", id)
      .single();
    
    // Upload new photo
    const filename = `${uuid()}-${photoToUpload.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("portraits")
      .upload(filename, photoToUpload, {
        cacheControl: "3600",
        upsert: false,
      });
    
    if (uploadError) {
      return json({ error: `Failed to upload photo: ${uploadError.message}` });
    }
    
    // Get the photo URL
    const { data } = supabase.storage
      .from("portraits")
      .getPublicUrl(filename);
    
    updateData.photo_url = data.publicUrl;
    
    // Delete old photo if exists
    if (existingPerson?.photo_url && !keepExistingPhoto) {
      try {
        const urlParts = existingPerson.photo_url.split("/");
        const oldFilename = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from("portraits")
          .remove([oldFilename]);
      } catch (error) {
        // Continue even if old photo deletion fails
        console.error("Failed to delete old photo:", error);
      }
    }
  } else if (!keepExistingPhoto) {
    // If no new photo and not keeping existing, set photo_url to null
    updateData.photo_url = null;
  }
  
  // Update the person record
  const { error: updateError } = await supabase
    .from("people")
    .update(updateData)
    .eq("id", id);
  
  if (updateError) {
    return json({ error: `Failed to update person: ${updateError.message}` });
  }
  
  return redirect(`/people/${id}`);
}

export default function EditPerson() {
  const { person } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [keepPhoto, setKeepPhoto] = useState(true);
  const navigation = useNavigation();
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);
  const compressedPhotoRef = useRef<HTMLInputElement>(null);
  
  // Check if the form is currently submitting
  const isSubmitting = navigation.state === "submitting" || isCompressing;
  
  // Initialize form with existing data
  useEffect(() => {
    if (person.date_met) {
      setSelectedDate(person.date_met);
    }
  }, [person]);
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      setIsCompressing(true);
      setFileDetails(`Original: ${Math.round(file.size / 1024)} KB`);
      
      try {
        const compressed = await compressImage(file, 300);
        setCompressedFile(compressed);
        setFileDetails(`Original: ${Math.round(file.size / 1024)} KB, Compressed: ${Math.round(compressed.size / 1024)} KB`);
      } catch (error) {
        console.error("Error compressing image:", error);
        setFileDetails(`Original: ${Math.round(file.size / 1024)} KB (Compression failed)`);
      } finally {
        setIsCompressing(false);
      }
    } else {
      setCompressedFile(null);
      setFileDetails("");
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit {person.name}</h2>
        <a
          href={`/people/${person.id}`}
          className={`text-blue-600 hover:text-blue-800 ${
            isSubmitting ? "pointer-events-none opacity-50" : ""
          }`}
          tabIndex={isSubmitting ? -1 : undefined}
        >
          Cancel
        </a>
      </div>
      
      {actionData?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {actionData.error}
        </div>
      )}
      
      {/* Show loading overlay when submitting */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">
              {isCompressing ? "Compressing image..." : "Updating person..."}
            </p>
            <p className="text-sm text-gray-500 mt-2">Please wait, this may take a moment if uploading a new photo.</p>
          </div>
        </div>
      )}
      
      <Form method="post" encType="multipart/form-data" className="space-y-4">
        {/* Hidden input for compressed photo */}
        <input 
          type="hidden" 
          name="compressedPhoto" 
          ref={compressedPhotoRef} 
        />
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={person.name}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
          {actionData?.fieldErrors?.name && (
            <p className="text-red-500 text-sm mt-1">{actionData.fieldErrors.name}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            defaultValue={person.location || ""}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="context" className="block text-sm font-medium mb-1">
            How You Met
          </label>
          <input
            type="text"
            id="context"
            name="context"
            defaultValue={person.context || ""}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="their_story" className="block text-sm font-medium mb-1">
            Their Story
          </label>
          <textarea
            id="their_story"
            name="their_story"
            defaultValue={person.their_story || ""}
            rows={4}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="date_met" className="block text-sm font-medium mb-1">
            Date Met
          </label>
          <input
            type="date"
            id="date_met"
            name="date_met"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="message_to_the_world" className="block text-sm font-medium mb-1">
            Message to the World
          </label>
          <textarea
            id="message_to_the_world"
            name="message_to_the_world"
            defaultValue={person.message_to_the_world || ""}
            rows={2}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="photo" className="block text-sm font-medium mb-1">Photo</label>
          
          {person.photo_url && (
            <div className="mb-3">
              <div className="flex items-start gap-4">
                <img 
                  src={person.photo_url} 
                  alt={person.name} 
                  className="w-24 h-24 object-cover rounded"
                />
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="keepExistingPhoto"
                      checked={keepPhoto}
                      onChange={() => setKeepPhoto(!keepPhoto)}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="keepExistingPhoto">
                      Keep existing photo
                    </label>
                  </div>
                  <input 
                    type="hidden" 
                    name="keepExistingPhoto" 
                    value={keepPhoto.toString()} 
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {keepPhoto 
                      ? "Upload a new photo to replace the existing one" 
                      : "Current photo will be removed if no new photo is uploaded"}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
            onChange={handleFileChange}
          />
          {fileDetails && (
            <p className="text-sm text-gray-500 mt-1">{fileDetails}</p>
          )}
          {isCompressing && (
            <p className="text-sm text-blue-500 mt-1">Compressing image...</p>
          )}
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
            onClick={() => {
              // Convert the compressed file to a DataTransfer object
              if (compressedFile && compressedPhotoRef.current) {
                const dt = new DataTransfer();
                dt.items.add(compressedFile);
                compressedPhotoRef.current.files = dt.files;
              }
            }}
          >
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </Form>
    </div>
  );
} 
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { supabase } from "~/utils/supabase.server";
import { compressImage } from "~/utils/imageCompression";
import { v4 as uuid } from "uuid";
import { useState, useRef } from "react";

type ActionData = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  
  // Get all form values
  const name = formData.get("name")?.toString();
  const location = formData.get("location")?.toString() || null;
  const context = formData.get("context")?.toString() || null;
  const their_story = formData.get("their_story")?.toString() || null;
  const date_met = formData.get("date_met")?.toString() || null;
  const message_to_the_world = formData.get("message_to_the_world")?.toString() || null;
  const photo = formData.get("photo") as File | null;
  const compressedPhoto = formData.get("compressedPhoto") as File | null;
  
  // Use the compressed photo if it exists, otherwise use the original
  const photoToUpload = compressedPhoto || photo;
  
  // Validate required fields
  const errors: Record<string, string> = {};
  
  if (!name) errors.name = "Name is required";
  
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }
  
  let photo_url = null;
  
  // Handle photo upload if provided
  if (photoToUpload && photoToUpload.size > 0) {
    const filename = `${uuid()}-${photoToUpload.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("portraits")
      .upload(filename, photoToUpload, {
        cacheControl: "3600",
        upsert: false,
      });
    
    if (uploadError) {
      return { error: `Failed to upload photo: ${uploadError.message}` };
    }
    
    // Get the photo URL
    const { data } = supabase.storage
      .from("portraits")
      .getPublicUrl(filename);
    
    photo_url = data.publicUrl;
  }
  
  // Insert the new person
  const { error: insertError } = await supabase.from("people").insert([
    {
      name,
      location,
      context,
      their_story,
      date_met,
      message_to_the_world,
      photo_url,
    },
  ]);
  
  if (insertError) {
    return { error: `Failed to add person: ${insertError.message}` };
  }
  
  return redirect("/people");
};

export default function NewPerson() {
  const actionData = useActionData<ActionData>();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const navigation = useNavigation();
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);
  const compressedPhotoRef = useRef<HTMLInputElement>(null);
  
  // Check if the form is currently submitting
  const isSubmitting = navigation.state === "submitting" || isCompressing;
  
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
      <h2 className="text-2xl font-semibold mb-6 text-white">Add New Person</h2>
      
      {actionData?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {actionData.error}
        </div>
      )}
      
      {/* Show loading overlay when submitting */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-black">
              {isCompressing ? "Compressing image..." : "Uploading photo and saving data..."}
            </p>
            <p className="text-sm text-gray-700 mt-2">Please wait, this may take a moment.</p>
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
          <label htmlFor="name" className="block text-sm font-medium mb-1 text-white">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full p-2 border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black"
            required
            disabled={isSubmitting}
          />
          {actionData?.fieldErrors?.name && (
            <p className="text-red-500 text-sm mt-1">{actionData.fieldErrors.name}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1 text-white">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            className="w-full p-2 border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="context" className="block text-sm font-medium mb-1 text-white">
            How You Met
          </label>
          <input
            type="text"
            id="context"
            name="context"
            className="w-full p-2 border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black"
            placeholder="e.g., At a conference, Through a friend"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="their_story" className="block text-sm font-medium mb-1 text-white">
            Their Story
          </label>
          <textarea
            id="their_story"
            name="their_story"
            rows={4}
            className="w-full p-2 border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black"
            placeholder="What's their story? What makes them unique?"
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="date_met" className="block text-sm font-medium mb-1 text-white">
            Date Met
          </label>
          <input
            type="date"
            id="date_met"
            name="date_met"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="message_to_the_world" className="block text-sm font-medium mb-1 text-white">
            Message to the World
          </label>
          <textarea
            id="message_to_the_world"
            name="message_to_the_world"
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black"
            placeholder="A message or quote they'd like to share"
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="photo" className="block text-sm font-medium mb-1 text-white">
            Photo
          </label>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            className="w-full p-2 border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black"
            disabled={isSubmitting}
            onChange={handleFileChange}
          />
          {fileDetails && (
            <p className="text-sm text-gray-700 mt-1">{fileDetails}</p>
          )}
          {isCompressing && (
            <p className="text-sm text-blue-700 mt-1">Compressing image...</p>
          )}
        </div>
        
        <div className="flex justify-end gap-4">
          <a
            href="/people"
            className="border border-black hover:bg-gray-100 text-white py-2 px-6 rounded-lg disabled:opacity-50"
            tabIndex={isSubmitting ? -1 : undefined}
          >
            Cancel
          </a>
          <button
            type="submit"
            className="bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-lg disabled:opacity-50"
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
            {isSubmitting ? "Saving..." : "Save Person"}
          </button>
        </div>
      </Form>
    </div>
  );
} 
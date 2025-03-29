import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { supabase } from "~/utils/supabase.server";
import { v4 as uuid } from "uuid";
import { useState } from "react";

// Use client-only import for DatePicker
import { ClientOnly } from "~/components/ClientOnly";

// Define the shape of your database record
interface Person {
  name: string;
  photo_url: string;
  location: string;
  context: string;
  their_story: string;
  date_met: string;
  message_to_the_world: string;
}

// Define what's expected in your form submission
type PersonFormData = Omit<Person, 'photo_url'> & {
  photo: File;
};

type ActionData = {
  error?: string;
  fieldErrors?: Partial<Record<keyof PersonFormData, string>>;
};

// Function to validate form data
function validateFormData(formData: FormData): { data: PersonFormData | null, errors: Partial<Record<keyof PersonFormData, string>> } {
  const errors: Partial<Record<keyof PersonFormData, string>> = {};
  
  const name = formData.get("name")?.toString();
  const location = formData.get("location")?.toString();
  const context = formData.get("context")?.toString();
  const their_story = formData.get("their_story")?.toString();
  const date_met = formData.get("date_met")?.toString();
  const message_to_the_world = formData.get("message_to_the_world")?.toString() || "";
  const photo = formData.get("photo");
  
  if (!name) errors.name = "Name is required";
  if (!location) errors.location = "Location is required";
  if (!context) errors.context = "Context is required";
  if (!their_story) errors.their_story = "Story is required";
  if (!date_met) errors.date_met = "Date is required";
  if (!(photo instanceof File) || photo.size === 0) errors.photo = "Photo is required";
  
  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }
  
  // TypeScript will ensure all required fields exist and have correct types
  return { 
    data: {
      name: name!,
      location: location!,
      context: context!,
      their_story: their_story!,
      date_met: date_met!,
      message_to_the_world,
      photo: photo as File
    }, 
    errors: {} 
  };
}

export const action = async ({ request }: ActionFunctionArgs): Promise<ActionData | Response> => {
  const formData = await request.formData();
  const { data, errors } = validateFormData(formData);
  
  if (!data) {
    return { error: "Invalid form submission", fieldErrors: errors };
  }
  
  const filename = `${uuid()}-${data.photo.name}`;

  const { error: uploadError } = await supabase.storage
    .from("portraits")
    .upload(filename, data.photo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Get the public URL from Supabase storage
  const { data: storageData } = supabase.storage
    .from("portraits")
    .getPublicUrl(filename);
  
  const photo_url = storageData.publicUrl;

  // When inserting to database, TypeScript will verify the object structure matches Person
  const personToInsert: Omit<Person, 'photo_url'> & { photo_url: string } = {
    name: data.name,
    location: data.location,
    context: data.context,
    their_story: data.their_story,
    date_met: data.date_met,
    message_to_the_world: data.message_to_the_world,
    photo_url
  };
  
  const { error: insertError } = await supabase.from("people").insert([personToInsert]);

  if (insertError) {
    return { error: insertError.message };
  }

  return redirect("/people");
};

// Create a client-only DatePicker component
function DatePickerWrapper({ 
  selectedDate, 
  setSelectedDate 
}: { 
  selectedDate: Date | null, 
  setSelectedDate: (date: Date | null) => void 
}) {
  return (
    <ClientOnly fallback={<input type="date" name="date_met" className="w-full p-2 border" required />}>
      {() => {
        // We need to dynamically import these on the client only
        // Import using ESM dynamic import instead of require
        const DatePicker = (
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require("react-datepicker").default
        );
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("react-datepicker/dist/react-datepicker.css");
        
        return (
          <DatePicker
            id="date_met"
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            className="w-full p-2 border"
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
            placeholderText="Select a date"
            required
          />
        );
      }}
    </ClientOnly>
  );
}

export default function NewPerson() {
  const actionData = useActionData<ActionData>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Add a New Person</h1>
      {actionData?.error && <p className="text-red-500">{actionData.error}</p>}

      <Form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={(e) => {
        // Add the date to the form data before submission
        if (selectedDate) {
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'date_met';
          hiddenInput.value = selectedDate.toISOString().split('T')[0];
          e.currentTarget.appendChild(hiddenInput);
        }
      }}>
        <input type="text" name="name" placeholder="Name" className="w-full p-2 border" required />
        <input type="text" name="location" placeholder="Location" className="w-full p-2 border" required />
        <input type="text" name="context" placeholder="How you met" className="w-full p-2 border" required />
        <textarea name="their_story" placeholder="Their story..." className="w-full p-2 border" required></textarea>
        <input type="text" name="message_to_the_world" placeholder="Message to the world (optional)" className="w-full p-2 border" />
        <div className="form-group">
          <label htmlFor="date_met" className="block mb-1">Date Met</label>
          <DatePickerWrapper selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          {actionData?.fieldErrors?.date_met && (
            <p className="text-red-500 text-sm mt-1">{actionData.fieldErrors.date_met}</p>
          )}
        </div>
        <input type="file" name="photo" accept="image/*" className="w-full" required />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Submit
        </button>
      </Form>
    </div>
  );
}

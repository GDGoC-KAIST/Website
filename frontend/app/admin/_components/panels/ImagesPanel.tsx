import {Dispatch, FormEvent, SetStateAction} from "react";
import {ImageDoc} from "@/lib/types";
import {ResourcePanel, InputField, TextareaField} from "./common";
import {Button} from "@/components/ui/button";

interface ImagesPanelProps {
  images: ImageDoc[];
  form: {
    name: string;
    description: string;
    file: File | null;
  };
  setForm: Dispatch<SetStateAction<ImagesPanelProps["form"]>>;
  disableSubmit: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (image: ImageDoc) => void;
  onCopyId: (id: string) => void;
}

export default function ImagesPanel({
  images,
  form,
  setForm,
  disableSubmit,
  onSubmit,
  onDelete,
  onCopyId,
}: ImagesPanelProps) {
  return (
    <ResourcePanel
      form={
        <form onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">Upload Image</h2>
          <InputField
            label="Image Name"
            value={form.name}
            onChange={(value) => setForm({...form, name: value})}
            required
          />
          <TextareaField
            label="Description"
            value={form.description}
            onChange={(value) => setForm({...form, description: value})}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">File</p>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setForm({...form, file});
                event.currentTarget.value = "";
              }}
            />
            <div className="flex items-center gap-3">
              <label
                htmlFor="image-file"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                {form.file ? "Change file" : "Choose file"}
              </label>
              <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {form.file ? (
                  <span className="block truncate">{form.file.name}</span>
                ) : (
                  <span className="text-gray-400">No file selected</span>
                )}
              </div>
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={disableSubmit || !form.file}>
            Upload Image
          </Button>
        </form>
      }
      list={
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Images</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {images.map((image) => (
              <div key={image.id} className="rounded-xl border border-gray-100 p-4 space-y-2">
                <p className="font-semibold">{image.name}</p>
                <p className="text-xs text-gray-500">{image.id}</p>
                <div className="flex gap-2 text-sm">
                  <button className="text-primary" onClick={() => onCopyId(image.id)}>
                    Copy ID
                  </button>
                  <button className="text-red-500" onClick={() => onDelete(image)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

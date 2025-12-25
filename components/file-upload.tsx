"use client";

import { useRef } from "react";
import { FileIcon, X } from "lucide-react";
import Image from "next/image";

interface FileUploadProps {
  onChange: (file?: File, previewUrl?: string) => void;
  name?: string;
  type?: string;
  value?: string;
  endpoint: "messageFile" | "serverImage"
}

export const FileUpload = ({ onChange, value, type, endpoint, name }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Файл слишком большой! Максимум 4MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange(file, previewUrl);
  };

  const getAcceptValue = () => {
    if (endpoint === "messageFile") {
      return "image/*,application/pdf";
    }
    return "image/*";
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange(undefined, "");
  };

  if (value && type !== "application/pdf") {
    return (
      <div className="relative h-20 w-20">
        <Image
          fill
          src={value}
          alt="Загружено"
          className="rounded-full object-cover"
        />
        <button
          onClick={handleClear}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm border-2 border-white"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (value && type === "application/pdf") {
    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
        <a 
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
        >
          {name ? name : value}
        </a>
        <button
          onClick={handleClear}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm border-2 border-white"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 border-2 border-dashed border-zinc-400 rounded-lg hover:border-zinc-600 transition-colors cursor-pointer">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={getAcceptValue()}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-full flex flex-col items-center space-y-2 text-zinc-500"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">Выберите {endpoint === "messageFile" ? "файл" : "изображение"}</p>
        <p className="text-xs">{endpoint === "messageFile" ? "PNG, JPG, PDF до 4MB" : "PNG, JPG до 4MB"}</p>
      </button>
    </div>
  );
};

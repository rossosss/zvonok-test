// MessageFileModal.tsx - полная исправленная версия
"use client";

import axios from "axios";
import qs from "query-string";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";

const formSchema = z.object({
  fileUrl: z.string().min(1, {
    message: "Файл обязателен."
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const MessageFileModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const [file, setFile] = useState<File | undefined>(undefined);
  const router = useRouter();

  const isModalOpen = isOpen && type === "messageFile";
  const { apiUrl, query } = data;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileUrl: "",
    },
  });

  const handleClose = () => {
    form.reset();
    setFile(undefined); // добавьте сброс файла
    onClose();
  };

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: FormValues) => {
    try {
      if (!file) {
        form.setError("fileUrl", { message: "Файл обязателен" });
        return;
      }
      const url = qs.stringifyUrl({
        url: apiUrl || "",
        query
      })

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      
      const uploadResponse = await axios.post("/api/upload", uploadFormData);
      const fileUrl = uploadResponse.data.url;

      await axios.post(url, {
        content: fileUrl || "",
        fileUrl: fileUrl
      });

      router.refresh();
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden max-w-md">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Прикрепить файлы
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Отправьте файл или изображение
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <div className="flex items-center justify-center text-center">
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="messageFile"
                          value={field.value}
                          name={file?.name}
                          type={file?.type}
                          onChange={(file, previewUrl) => {
                            setFile(file);
                            field.onChange(previewUrl || "");
                            
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button variant="primary" disabled={isLoading} className="w-full">
                {isLoading ? "Отправляется..." : "Отправить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

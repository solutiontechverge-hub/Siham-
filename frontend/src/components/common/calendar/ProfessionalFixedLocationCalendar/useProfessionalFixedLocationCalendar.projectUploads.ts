import * as React from "react";

type BookingProjectUpload = {
  id: string;
  name: string;
  previewUrl?: string;
  file?: File;
  url?: string;
  mimeType?: string;
  kind?: "image" | "document";
};

export function useProfessionalFixedLocationCalendarProjectUploads(
  setBookingProjectUploads: React.Dispatch<
    React.SetStateAction<BookingProjectUpload[]>
  >,
) {
  const handleProjectFilePick = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      const stamp = Date.now();
      setBookingProjectUploads((prev) => [
        ...prev,
        ...files.map((file, index) => ({
          id: `upload-${stamp}-${prev.length + index}`,
          name: file.name || `upload-${prev.length + index + 1}`,
          previewUrl: URL.createObjectURL(file),
          file,
        })),
      ]);
      e.target.value = "";
    },
    // ponytail: match prior []; setState identity is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const deleteProjectUpload = React.useCallback((uploadId: string) => {
    setBookingProjectUploads((prev) => {
      const target = prev.find((u) => u.id === uploadId);
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((u) => u.id !== uploadId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { handleProjectFilePick, deleteProjectUpload };
}

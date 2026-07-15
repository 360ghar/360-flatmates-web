export { optionalNumberValue } from "@/lib/utils/format";

export interface PendingImage {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
}

// /app/(your-path)/page.tsx
import RealtimeWrapper from "@/components/providers/RealtimePreviewProvider";
import { getPreview } from "./actions";
import PreviewGenForm from "@/components/shared/preview/PreviewGenForm";

export default async function Page({ params }: { params: { id: string } }) {
  // Fetch the initial preview data on the server side
  const preview = await getPreview(params.id);

  return (
    <RealtimeWrapper initialPreview={preview} previewId={params.id}>
      <PreviewGenForm />
    </RealtimeWrapper>
  );
}

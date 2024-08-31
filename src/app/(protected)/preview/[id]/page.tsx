import PreviewGenForm from "@/components/shared/PreviewGenForm";
import { getPreview } from "./actions";

async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: {};
}) {
  const preview = await getPreview(params?.id as string);

  console.log("preview");
  console.log(preview);

  return (
    <div>
      <PreviewGenForm preview={preview} />
    </div>
  );
}

export default Page;

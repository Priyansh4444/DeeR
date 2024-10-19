import Call from "@/components/VideoCall";

export default function Page({ params }: { params: { channelName: string } }) {
  return (
    <main className="flex w-full flex-col">
      <p className="absolute z-10 mt-2 ml-12 text-2xl font-bold text-gray-900">
        {params.channelName!}
      </p>
      <Call
        appId={process.env.PUBLIC_AGORA_APP_ID!}
        channelName={params.channelName}
      ></Call>
    </main>
  );
}

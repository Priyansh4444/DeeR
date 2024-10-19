"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-4 mt-20 text-4xl font-extrabold leading-none tracking-tight text-gray-500">
        <span className="text-white">NextJS</span> x{" "}
        <span className="text-blue-500">Agora</span>
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const target = e.target as typeof e.target & {
            channel: { value: string };
          };
          router.push(`/channel/${target.channel.value}`);
        }}
      >
        <div className="md:flex md:items-center mt-6">
          <div>
            <label
              className="block text-green-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
              htmlFor="inline-full-name"
            >
              Channel Name
            </label>
          </div>
          <div>
            <input
              className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              id="inline-full-name"
              type="text"
              name="channel"
              placeholder="Enter channel name"
              required
            />
          </div>
        </div>
        <div className="text-center">
          <button className="inline-flex items-center justify-center px-5 py-3 mt-5 text-base font-medium text-center text-white bg-red-400 rounded-lg hover:bg-red-500 duration-300 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

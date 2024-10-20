"use client";
import { useRouter } from "next/navigation";
import { Loader, PointMaterial, Points } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";
import { Experience } from "@/components/Experience";
import { UI } from "@/components/UI";
import * as random from "maath/random/dist/maath-random.esm";

export default function Home() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-screen bg-black">
      {/* Blurred background */}
      <div className="absolute inset-0 backdrop-blur-3xl">
        <Canvas shadows camera={{ position: [-0.5, 1, 4], fov: 45 }}>
          <Stars />

          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
        <Loader />
      </div>

      {/* Foreground form */}
      <div
        className={`z-10 transition-all duration-500 ease-in-out w-96 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="bg-opacity-80 bg-brown-900 p-8 rounded-lg shadow-2xl transform perspective-1000 rotate-y-2 max-w-md w-full backdrop-blur-lg">
          <h1 className="mb-6 text-5xl font-extrabold leading-none tracking-tight text-center text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-500 to-yellow-600">
              DeeR
            </span>
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as typeof e.target & {
                channel: { value: string };
              };
              router.push(`/channel/${target.channel.value}`);
            }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="w-full">
              <label
                className="block text-white font-bold mb-2"
                htmlFor="channel-name"
              >
                Chapter Name
              </label>
              <input
                className="bg-parchment bg-opacity-90 border-2 border-sepia rounded w-full py-2 px-4 text-brown-900 leading-tight focus:outline-none focus:border-gold"
                id="channel-name"
                type="text"
                name="channel"
                placeholder="Let's get learning peacefully"
                required
              />
            </div>
            <button className="px-6 flex flex-row align-middle items-center text-white py-3 text-lg backdrop-blur-xl hover:backdrop-blur-3xl font-medium bg-opacity-90 bg-sepia rounded-lg hover:bg-gold transition duration-300 focus:ring-4 focus:ring-gold">
              <img src="/Logo.png" className="h-16 w-16" /> Begin Journey
            </button>
          </form>
        </div>
      </div>

      {/* Button to open form */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="z-10 backdrop-blur-lg text-white hover:backdrop-blur-3xl px-6 py-3 mt-4 text-lg font-medium text-parchment bg-opacity-90 bg-sepia rounded-lg hover:bg-gold transition duration-300 focus:ring-4 focus:ring-gold"
        >
          Open Book
        </button>
      )}

      <UI />
    </div>
  );
}

function Stars(props) {
  const ref = useRef();
  const [sphere] = useState(() =>
    random.inSphere(new Float32Array(3000), { radius: 3 })
  );

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={sphere}
        stride={3}
        frustumCulled={false}
        {...props}
      >
        <PointMaterial
          transparent
          color="#ffa0e0"
          size={0.01}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

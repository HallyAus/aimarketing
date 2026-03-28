import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">AdPilot</h1>
      <p className="text-lg text-gray-600 mb-8">
        Automated marketing agency platform
      </p>
      <Link
        href="/signin"
        className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
      >
        Get Started
      </Link>
    </main>
  );
}

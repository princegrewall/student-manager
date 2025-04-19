import { useState } from "react";
import Navbar from "@/components/Navbar";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "Lightning fast performance",
  "Secure by default",
  "Real-time updates",
  "24/7 Support"
];

const Index = () => {
  const [showNavbar, setShowNavbar] = useState(false);

  const handleGetStarted = () => {
    setShowNavbar(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f1a] text-white relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 -z-10 before:content-[''] before:absolute before:inset-0 before:animate-spin-slow before:bg-[conic-gradient(at_top_left,_#9333ea,_#3b82f6,_#ec4899)] before:opacity-30 blur-3xl scale-[1.5]" />

      <Navbar showNavbar={showNavbar} />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl drop-shadow-lg">
              Build your next great idea faster
            </h1>
            <p className="mt-6 text-lg leading-8 text-purple-200">
              Everything you need to deploy your app, plus tools to manage it
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/signup"
                onClick={handleGetStarted}
                className="rounded-md bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition"
              >
                Get started
              </Link>
              <Link
                to="/learn-more"
                className="text-sm font-semibold leading-6 text-purple-200 flex items-center gap-1 hover:text-white transition"
              >
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-[#1c1c2a] py-24 sm:py-32 relative z-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-purple-400">Deploy faster</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything you need to deploy your app
              </p>
              <p className="mt-6 text-lg leading-8 text-purple-200">
                Get your ideas to market faster with our comprehensive platform
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-x-4 bg-white/5 backdrop-blur-sm p-4 rounded-lg shadow-md hover:bg-white/10 transition"
                  >
                    <CheckCircle2 className="h-6 w-6 flex-none text-purple-400" />
                    <span className="text-purple-100 text-base">{feature}</span>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen flex flex-col bg-[#1A1F2C] text-white">
      <Navbar showNavbar={showNavbar} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-purple-600 to-blue-500 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Build your next great idea faster
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Everything you need to deploy your app, plus tools to manage it
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/signup"
                  onClick={handleGetStarted}
                  className="rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                >
                  Get started
                </Link>
                <Link to="/learn-more" className="text-sm font-semibold leading-6 text-white flex items-center gap-1">
                  Learn more <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-[#222222] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-purple-400">Deploy faster</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything you need to deploy your app
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Get your ideas to market faster with our comprehensive platform
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature} className="flex gap-x-3">
                    <CheckCircle2 className="h-5 w-5 flex-none text-purple-400" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

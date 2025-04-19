
import { Rocket } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Rocket className="w-6 h-6 text-purple-600" />
      <span className="font-semibold text-xl">WebFlow</span>
    </div>
  );
};

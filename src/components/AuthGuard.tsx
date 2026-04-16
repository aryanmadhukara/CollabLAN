import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { getStoredAuthToken } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();

    if (!token) {
      navigate({
        to: "/login",
        search: {
          redirect: location.href,
        },
        replace: true,
      });
      return;
    }

    setIsCheckingAuth(false);
  }, [location.href, navigate]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-[#dff7ff]">
        <div className="pixel-window px-6 py-4 text-center">
          <div className="section-label">Auth Check</div>
          <p className="mt-2">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

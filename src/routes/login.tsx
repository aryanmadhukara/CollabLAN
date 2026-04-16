import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPasswordValidationMessage,
  getStoredAuthToken,
  isValidEmail,
  loginWithPassword,
  setStoredAuthToken,
  signupWithPassword,
} from "@/lib/auth";

type LoginSearch = {
  redirect?: string;
  mode?: "login" | "signup";
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    mode: search.mode === "signup" ? "signup" : "login",
  }),
  beforeLoad: () => {
    if (getStoredAuthToken()) {
      throw Route.redirect({
        to: "/",
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Authentication | CollabLAN" },
      { name: "description", content: "Log in or sign up to access the CollabLAN dashboard." },
    ],
  }),
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ authenticateUser }, { signJwt }] = await Promise.all([
          import("@/lib/auth-store"),
          import("@/lib/jwt"),
        ]);

        const body = (await request.json().catch(() => null)) as
          | { email?: string; password?: string }
          | null;

        const email = body?.email?.trim().toLowerCase();
        const password = body?.password;

        if (!email || !password) {
          return Response.json(
            {
              error: "Email and password are required.",
            },
            { status: 400 },
          );
        }

        const user = await authenticateUser({
          email,
          password,
        });

        if (!user) {
          return Response.json(
            {
              error: "Invalid email or password.",
            },
            { status: 401 },
          );
        }

        const token = await signJwt(
          {
            sub: email,
            email,
            name: user.name,
            iat: Math.floor(Date.now() / 1000),
          },
          process.env.JWT_SECRET || "collablan-local-dev-secret",
        );

        return Response.json(
          {
            token,
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );
      },
    },
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const isSignupMode = search.mode === "signup";
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = loginEmail.trim().toLowerCase();

    if (!normalizedEmail || !loginPassword) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await loginWithPassword({
        email: normalizedEmail,
        password: loginPassword,
      });

      setStoredAuthToken(response.token);

      await navigate({
        to: search.redirect || "/",
        href: search.redirect,
        replace: true,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = signupName.trim();
    const normalizedEmail = signupEmail.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !signupPassword || !confirmPassword) {
      setErrorMessage("Please complete all signup fields.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const passwordMessage = getPasswordValidationMessage(signupPassword);

    if (passwordMessage) {
      setErrorMessage(passwordMessage);
      return;
    }

    if (signupPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await signupWithPassword({
        name: normalizedName,
        email: normalizedEmail,
        password: signupPassword,
        confirmPassword,
      });

      setStoredAuthToken(response.token);

      await navigate({
        to: search.redirect || "/",
        href: search.redirect,
        replace: true,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign up.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function setMode(mode: "login" | "signup") {
    setErrorMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);

    await navigate({
      to: "/login",
      search: {
        redirect: search.redirect,
        mode,
      },
      replace: true,
    });
  }

  return (
    <div className="dashboard-shell flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="pixel-window relative z-10 w-full max-w-md p-5 sm:p-7">
        <div className="hero-chip">Secure Team Access</div>
        <h1 className="pixel-heading mt-5 text-lg text-white sm:text-xl">
          {isSignupMode ? "Create Your Account" : "Welcome Back"}
        </h1>
        <p className="mt-3 text-[#d4efff]">
          {isSignupMode
            ? "Sign up to start collaborating in the dashboard."
            : "Log in to return to the CollabLAN dashboard."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`h-11 border-4 border-[#0f1736] font-display text-[0.55rem] uppercase ${
              !isSignupMode
                ? "bg-[#ffe55c] text-[#1d2c58] shadow-[4px_4px_0_#ff5438]"
                : "bg-[#2a4678] text-[#dff7ff] shadow-[4px_4px_0_#0f1736]"
            }`}
            onClick={() => void setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`h-11 border-4 border-[#0f1736] font-display text-[0.55rem] uppercase ${
              isSignupMode
                ? "bg-[#ffe55c] text-[#1d2c58] shadow-[4px_4px_0_#ff5438]"
                : "bg-[#2a4678] text-[#dff7ff] shadow-[4px_4px_0_#0f1736]"
            }`}
            onClick={() => void setMode("signup")}
          >
            Signup
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={isSignupMode ? handleSignupSubmit : handleLoginSubmit}
          noValidate
        >
          {isSignupMode && (
            <div className="space-y-2">
              <label className="section-label block text-[#ffe55c]" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={signupName}
                onChange={(event) => setSignupName(event.target.value)}
                className="glass-input h-11 border-[#0f1736] text-white placeholder:text-[#a6c4db]"
                placeholder="Your name"
                aria-invalid={Boolean(errorMessage)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="section-label block text-[#ffe55c]" htmlFor={isSignupMode ? "signup-email" : "login-email"}>
              Email
            </label>
            <Input
              id={isSignupMode ? "signup-email" : "login-email"}
              type="email"
              autoComplete="email"
              value={isSignupMode ? signupEmail : loginEmail}
              onChange={(event) =>
                isSignupMode ? setSignupEmail(event.target.value) : setLoginEmail(event.target.value)
              }
              className="glass-input h-11 border-[#0f1736] text-white placeholder:text-[#a6c4db]"
              placeholder="admin@collablan.dev"
              aria-invalid={Boolean(errorMessage)}
            />
          </div>

          <div className="space-y-2">
            <label className="section-label block text-[#ffe55c]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignupMode ? "new-password" : "current-password"}
                value={isSignupMode ? signupPassword : loginPassword}
                onChange={(event) =>
                  isSignupMode
                    ? setSignupPassword(event.target.value)
                    : setLoginPassword(event.target.value)
                }
                className="glass-input h-11 border-[#0f1736] pr-11 text-white placeholder:text-[#a6c4db]"
                placeholder="Enter your password"
                aria-invalid={Boolean(errorMessage)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#ffe55c]"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignupMode && (
            <div className="space-y-2">
              <label className="section-label block text-[#ffe55c]" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="glass-input h-11 border-[#0f1736] pr-11 text-white placeholder:text-[#a6c4db]"
                  placeholder="Confirm your password"
                  aria-invalid={Boolean(errorMessage)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#ffe55c]"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-sm text-[#d4efff]">
                Use 8+ characters with uppercase, lowercase, number, and special character.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-none border-2 border-[#5d0f16] bg-[#3b1118] px-3 py-2 text-[#ffc7cf]">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            className="pixel-button h-11 w-full text-[0.55rem]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                {isSignupMode ? "Creating Account..." : "Logging In..."}
              </>
            ) : (
              isSignupMode ? "Create Account" : "Log In"
            )}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[#d4efff]">
          Protected routes redirect guests here until authentication succeeds.
        </p>
        <p className="mt-2 text-sm text-[#d4efff]">
          <Link to="/" className="text-[#ffe55c] underline underline-offset-4">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

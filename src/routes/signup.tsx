import { createFileRoute } from "@tanstack/react-router";
import { getPasswordValidationMessage, isValidEmail } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    throw Route.redirect({
      to: "/login",
      search: {
        mode: "signup",
      },
    });
  },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ createUser }, { signJwt }] = await Promise.all([
          import("@/lib/auth-store"),
          import("@/lib/jwt"),
        ]);

        const body = (await request.json().catch(() => null)) as
          | {
              name?: string;
              email?: string;
              password?: string;
              confirmPassword?: string;
            }
          | null;

        const name = body?.name?.trim();
        const email = body?.email?.trim().toLowerCase();
        const password = body?.password;
        const confirmPassword = body?.confirmPassword;

        if (!name || !email || !password || !confirmPassword) {
          return Response.json(
            {
              error: "All signup fields are required.",
            },
            { status: 400 },
          );
        }

        if (!isValidEmail(email)) {
          return Response.json(
            {
              error: "Please enter a valid email address.",
            },
            { status: 400 },
          );
        }

        const passwordMessage = getPasswordValidationMessage(password);

        if (passwordMessage) {
          return Response.json(
            {
              error: passwordMessage,
            },
            { status: 400 },
          );
        }

        if (password !== confirmPassword) {
          return Response.json(
            {
              error: "Passwords do not match.",
            },
            { status: 400 },
          );
        }

        try {
          const user = await createUser({
            name,
            email,
            password,
          });

          const token = await signJwt(
            {
              sub: user.email,
              email: user.email,
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
              status: 201,
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (error) {
          return Response.json(
            {
              error: error instanceof Error ? error.message : "Unable to create account.",
            },
            { status: 409 },
          );
        }
      },
    },
  },
  component: SignupRouteComponent,
});

function SignupRouteComponent() {
  return null;
}

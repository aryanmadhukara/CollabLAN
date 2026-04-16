export type AuthUser = {
  name: string;
  email: string;
  passwordHash: string;
};

const users = new Map<string, AuthUser>();
let seedPromise: Promise<void> | null = null;

async function getBcrypt() {
  return import("bcryptjs");
}

export async function ensureSeedUser() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const email = (process.env.AUTH_EMAIL || "admin@collablan.dev").trim().toLowerCase();
      const password = process.env.AUTH_PASSWORD || "CollabLAN123!";
      const name = process.env.AUTH_NAME || "CollabLAN Admin";

      if (users.has(email)) {
        return;
      }

      const bcrypt = await getBcrypt();
      const passwordHash = await bcrypt.hash(password, 10);

      users.set(email, {
        name,
        email,
        passwordHash,
      });
    })();
  }

  await seedPromise;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  await ensureSeedUser();

  const email = input.email.trim().toLowerCase();

  if (users.has(email)) {
    throw new Error("An account with that email already exists.");
  }

  const bcrypt = await getBcrypt();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = {
    name: input.name.trim(),
    email,
    passwordHash,
  };

  users.set(email, user);

  return user;
}

export async function authenticateUser(input: { email: string; password: string }) {
  await ensureSeedUser();

  const email = input.email.trim().toLowerCase();
  const user = users.get(email);

  if (!user) {
    return null;
  }

  const bcrypt = await getBcrypt();
  const isValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return user;
}

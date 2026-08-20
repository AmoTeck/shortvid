/**
 * Local multi-user auth — fully offline, IndexedDB, Web Crypto hashing.
 * Each user gets an isolated project namespace.
 */

import { get, set, del, createStore } from "idb-keyval";
import { AuthSession, UserAccount } from "./types";
import { uid } from "./utils";

const userStore = createStore("storycinema-auth", "users");
const sessionStore = createStore("storycinema-auth", "session");

const USER_INDEX = "user-index";
const SESSION_KEY = "current-session";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function listUsernames(): Promise<string[]> {
  return (await get<string[]>(USER_INDEX, userStore)) || [];
}

export async function getUserByUsername(username: string): Promise<UserAccount | null> {
  const key = username.trim().toLowerCase();
  return (await get<UserAccount>(key, userStore)) || null;
}

export async function getUserById(id: string): Promise<UserAccount | null> {
  const names = await listUsernames();
  for (const n of names) {
    const u = await getUserByUsername(n);
    if (u?.id === id) return u;
  }
  return null;
}

export async function registerUser(opts: {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
}): Promise<{ ok: true; user: UserAccount } | { ok: false; error: string }> {
  const username = opts.username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return { ok: false, error: "Username: 3–24 chars, letters/numbers/underscore only" };
  }
  if (opts.password.length < 4) {
    return { ok: false, error: "Password must be at least 4 characters" };
  }
  if (await getUserByUsername(username)) {
    return { ok: false, error: "Username already taken" };
  }

  const salt = randomSalt();
  const passwordHash = await sha256(salt + opts.password);
  const colors = ["#6c8cff", "#a78bfa", "#22d3ee", "#f472b6", "#34d399", "#fbbf24"];
  const user: UserAccount = {
    id: uid("user"),
    username,
    displayName: opts.displayName?.trim() || username,
    email: opts.email?.trim() || "",
    passwordHash,
    salt,
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    preferences: {},
  };

  await set(username, user, userStore);
  const names = await listUsernames();
  names.push(username);
  await set(USER_INDEX, names, userStore);

  return { ok: true, user };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ ok: true; session: AuthSession; user: UserAccount } | { ok: false; error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { ok: false, error: "Invalid username or password" };
  const hash = await sha256(user.salt + password);
  if (hash !== user.passwordHash) return { ok: false, error: "Invalid username or password" };

  user.lastLoginAt = Date.now();
  await set(user.username, user, userStore);

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    token: uid("tok") + randomSalt(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  };
  await set(SESSION_KEY, session, sessionStore);
  return { ok: true, session, user };
}

export async function logoutUser(): Promise<void> {
  await del(SESSION_KEY, sessionStore);
}

export async function getSession(): Promise<AuthSession | null> {
  const s = await get<AuthSession>(SESSION_KEY, sessionStore);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    await del(SESSION_KEY, sessionStore);
    return null;
  }
  return s;
}

export async function ensureDefaultUser(): Promise<void> {
  // Create the owner's account if missing (requested by user)
  const existing = await getUserByUsername("amoteck");
  if (!existing) {
    await registerUser({
      username: "amoteck",
      password: "storycinema",
      displayName: "AmoTeck",
      email: "owner@storycinema.app",
    });
  }
}

export async function listUsersPublic(): Promise<
  { id: string; username: string; displayName: string; avatarColor: string }[]
> {
  const names = await listUsernames();
  const out = [];
  for (const n of names) {
    const u = await getUserByUsername(n);
    if (u) out.push({ id: u.id, username: u.username, displayName: u.displayName, avatarColor: u.avatarColor });
  }
  return out;
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<UserAccount, "displayName" | "email" | "avatarColor" | "preferences">>
): Promise<UserAccount | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  const next = { ...user, ...patch };
  await set(user.username, next, userStore);
  return next;
}

export async function changePassword(
  userId: string,
  oldPass: string,
  newPass: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getUserById(userId);
  if (!user) return { ok: false, error: "User not found" };
  const oldHash = await sha256(user.salt + oldPass);
  if (oldHash !== user.passwordHash) return { ok: false, error: "Current password incorrect" };
  if (newPass.length < 4) return { ok: false, error: "New password too short" };
  const salt = randomSalt();
  user.salt = salt;
  user.passwordHash = await sha256(salt + newPass);
  await set(user.username, user, userStore);
  return { ok: true };
}

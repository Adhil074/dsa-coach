import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// use current DB helper and model paths
import { connectToDatabase } from "../../../../../lib/db"; //it helps to read users data from database
import { User } from "../../../../../lib/models/user"; //helps to read mongodb user models from db so that nextauth can find user by email and check password during login
import { compare } from "bcryptjs"; //compare takes plain password from login and hashed password from db and tells matched or not

// tiny helper — safely coerce unknown -> string without using `any`
function toStringSafe(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/**
 * Minimal credentials shape NextAuth will pass to authorize()
 */
type Creds = { email?: unknown; password?: unknown };

const authOptions = {
  //authoptions creates obj holds nextauth settings nd nextauthoptions tells ts the exact shape this obj should follow
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials: Creds | undefined) {
        //credentials contains email and password sent from login form
        if (!credentials) {
          return null;
        }

        // coerce safely to strings
        const email = toStringSafe(credentials.email).toLowerCase().trim();
        const password = toStringSafe(credentials.password);

        if (!email || !password) {
          //if email or password missing from form, login fails
          return null;
        }

        await connectToDatabase(); //make sures there is an active connection before any query

        // use lean() so we get plain object (easier typing)
        const user = await User.findOne({ email }).lean().exec();
        if (!user) {
          //if user not found in db, login fails
          return null;
        }

        // ensure hashed password is a string
        const hashed = toStringSafe((user as { password?: unknown }).password);

        const isPasswordValid = await compare(password, hashed);
        if (!isPasswordValid) {
          //if password does not match hashed password in db, login fails
          return null;
        }

        //if everything is correct, return basic user data for session
        return {
          id: String((user as { _id?: unknown })._id ?? ""),
          email: toStringSafe((user as { email?: unknown }).email),
          name: toStringSafe((user as { name?: unknown }).name) || undefined,
        };
      },
    }),
  ],

  // keep the same as your original
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login", // your custom login page route
  },

  // ensure NEXTAUTH_SECRET is set in .env.local; fallback for dev
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret",
} as Parameters<typeof NextAuth>[0]; // infer type from NextAuth so we avoid import/TS mismatch

// NextAuth v5 returns an object with handlers — use the object it returns and export GET/POST
const auth = NextAuth(authOptions);

// runtime export: for v5 `auth` exposes GET and POST handlers.
// TypeScript may not know the exact runtime shape — use narrow export with ts-ignore comments to avoid lint noise.
 // eslint-disable-next-line @typescript-eslint/ban-ts-comment
 // @ts-ignore
export const GET = auth.GET;
 // eslint-disable-next-line @typescript-eslint/ban-ts-comment
 // @ts-ignore
export const POST = auth.POST;


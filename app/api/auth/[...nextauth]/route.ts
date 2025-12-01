import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "../../../../../lib/db"; //it helps to read users data from database
import { User } from "../../../../../lib/models/user"; //helps to read mongodb user models from db so that nextauth can find user by email and check password during login
import { compare } from "bcryptjs"; //compare takes plain password from login and hashed password from db and tells matched or not

const authOptions = {
  //authoptions creates obj holds nextauth settings nd nextauthoptions tells ts the exact shape this obj should follow
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        //credentials contains email and password sent from login form

        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        if (!email || !password) {
          //if email or password missing from form, login fails
          return null;
        }

        await connectToDatabase(); //make sures there is an active connection before any query

        const user = await User.findOne({ email });
        if (!user) {
          //if user not found in db, login fails
          return null;
        }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          //if password does not match hashed password in db, login fails
          return null;
        }

        //if everything is correct, return basic user data for session
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { User } from "../../../../../lib/models/user"; //these two lines let signup route talk with mongodb and user schema
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  //this function runs when api gets post request
  try {
    // log incoming body for debugging (helpful during development)
    const body = await request.json();
    console.log("SIGNUP BODY:", body);

    const { name, email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // make sures db is connected and active
    await connectToDatabase();
    console.log("Connected to DB (signup route)");

    // check for existing user with same email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          message: "User with this email already exists",
        },
        { status: 400 }
      );
    }

    // hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user document
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // successful response (don't return password)
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // log full error server-side for debugging
    console.error("Signup error:", error);

    // safe type guard to detect objects that might have a numeric `code` property
    const hasNumericCode = (e: unknown): e is { code: number } =>
      typeof e === "object" && e !== null && "code" in e && typeof (e as { code: unknown }).code === "number";

    // If it's a duplicate key error from Mongo / Mongoose, return a 400 with clear message
    if (hasNumericCode(error) && error.code === 11000) {
      return NextResponse.json(
        { message: "Duplicate key error: email already exists" },
        { status: 400 }
      );
    }

    // return generic failure message (include error.message for dev)
    return NextResponse.json(
      {
        message: "Something went wrong while signing up",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
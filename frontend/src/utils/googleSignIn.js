import { registerPlugin } from "@capacitor/core";

const GoogleSignIn = registerPlugin("GoogleSignIn");

// Android mints the token against the same client id the website signs in with, so Whisprl accepts both the same way
export const signInWithGoogle = () => GoogleSignIn.signIn({ serverClientId: process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID });

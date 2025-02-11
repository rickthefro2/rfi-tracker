"use client";
import { useState } from "react";
import { signIn, signUp } from "../api/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleAuth(event) {
    event.preventDefault();
    setError(null);

    const authFunction = isSignUp ? signUp : signIn;
    const { user, error } = await authFunction(email, password);

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  }

  return (
    <div>
      <h1>{isSignUp ? "Sign Up" : "Login"}</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isSignUp ? "Sign Up" : "Login"}</button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Already have an account? Login" : "Need an account? Sign Up"}
      </button>
    </div>
  );
}

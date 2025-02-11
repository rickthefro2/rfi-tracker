"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase, { getUser } from "../lib/supabaseClient";


export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const loggedInUser = await getUser();
      if (!loggedInUser) {
        router.push("/login"); // Redirect to login if not authenticated
      } else {
        setUser(loggedInUser);
      }
    }
    fetchUser();
  }, []);

  // Logout function
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main>
      <h1>RFI Tracker 📋</h1>
      {user ? (
        <>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}

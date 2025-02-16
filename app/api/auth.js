import supabase from "../../lib/supabaseClient";

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return { error };

  const user = data.user;
  
  if (user) {
    await supabase.from("users").insert([
      {
        id: user.id,
        email: user.email,
        name: "New User",
      },
    ]);
  }

  return { user, error };
}



export async function signIn(email, password) {
  const { user, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

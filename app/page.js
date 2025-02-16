"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase, { getUser } from "../lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const router = useRouter();

  // Fetch authenticated user
  useEffect(() => {
    async function fetchUser() {
      const loggedInUser = await getUser();
      if (!loggedInUser) {
        router.push("/login"); // Redirect if not authenticated
      } else {
        setUser(loggedInUser);
        fetchProjects(); // Load projects
      }
    }
    fetchUser();
  }, []);

  // Fetch projects from Supabase
  async function fetchProjects() {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) {
      console.error("Error fetching projects:", error.message);
    } else {
      setProjects(data);
    }
  }

  // Function to create a new project
  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!projectName) return;

    console.log("Current User:", user);

    if (!user || !user.id) {
      console.error("Error: No authenticated user found.");
      return;
    }

    // Ensure user exists in Supabase
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingUser) {
      console.error("Error: User does not exist in the database.");
      return;
    }

    // Insert new project
    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: projectName,
          description: projectDescription,
          created_by: user.id,
        },
      ])
      .select("*"); // Ensures inserted data is retrieved

    if (error) {
      console.error("Error creating project:", error.message);
      return;
    }

    console.log("Project created:", data);

    if (Array.isArray(data) && data.length > 0) {
      setProjects((prevProjects) => [...prevProjects, data[0]]);
    }

    setProjectName("");
    setProjectDescription("");
  };

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main>
      <h1>RFI Tracker 📋</h1>

      {user ? (
        <>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleLogout}>Logout</button>

          <h2>Create a New Project</h2>
          <form onSubmit={handleCreateProject}>
            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Project Description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <button type="submit">Create Project</button>
          </form>

          <h2>Your Projects</h2>
          {projects.length > 0 ? (
            <ul>
              {projects.map((project) => (
                <li key={project.id}>
                  <strong>{project.name}</strong>: {project.description}
                </li>
              ))}
            </ul>
          ) : (
            <p>No projects found.</p>
          )}
        </>
      ) : (
        <p>Redirecting to login...</p>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase, { getUser } from "../lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [rfis, setRfis] = useState({});
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    async function fetchUser() {
      const loggedInUser = await getUser();
      if (!loggedInUser) {
        router.push("/login"); // Redirect to login if not authenticated
      } else {
        setUser(loggedInUser);
        fetchProjects();
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
    setLoading(false);
  }

  // Function to create a new project
  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!projectName) return;

    if (!user || !user.id) {
      console.error("Error: No authenticated user found.");
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ name: projectName, description: projectDescription, created_by: user.id }])
      .select("*");

    if (error) {
      console.error("Error creating project:", error.message);
      return;
    }

    setProjects((prevProjects) => [...prevProjects, data[0]]);
    setProjectName("");
    setProjectDescription("");
  };

  // Function to create an RFI
  const handleCreateRFI = async (event, projectId) => {
    event.preventDefault();
    const title = rfis[projectId]?.title || "";
    const description = rfis[projectId]?.description || "";

    if (!title) return;

    if (!user || !user.id) {
      console.error("Error: No authenticated user found.");
      return;
    }

    const { data, error } = await supabase
      .from("rfis")
      .insert([{ title, description, project_id: projectId, created_by: user.id }])
      .select("*");

    if (error) {
      console.error("Error creating RFI:", error.message);
      return;
    }

    console.log("RFI created:", data);

    // Clear input fields
    setRfis((prevRfis) => ({
      ...prevRfis,
      [projectId]: { title: "", description: "" },
    }));
  };

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main>
      <h1>RFI Tracker 📋</h1>

      {loading ? (
        <p>Loading...</p>
      ) : user ? (
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
            projects.map((project) => (
              <div key={project.id}>
                <h3>{project.name}</h3>
                <p>{project.description}</p>

                <h4>Add an RFI</h4>
                <form onSubmit={(e) => handleCreateRFI(e, project.id)}>
                  <input
                    type="text"
                    placeholder="RFI Title"
                    value={rfis[project.id]?.title || ""}
                    onChange={(e) =>
                      setRfis((prevRfis) => ({
                        ...prevRfis,
                        [project.id]: { ...prevRfis[project.id], title: e.target.value },
                      }))
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="RFI Description"
                    value={rfis[project.id]?.description || ""}
                    onChange={(e) =>
                      setRfis((prevRfis) => ({
                        ...prevRfis,
                        [project.id]: { ...prevRfis[project.id], description: e.target.value },
                      }))
                    }
                  />
                  <button type="submit">Submit RFI</button>
                </form>
              </div>
            ))
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

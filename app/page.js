"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase, { getUser } from "../lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [rfis, setRfis] = useState({});
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("All"); // Default: Show all RFIs
  const [sortOrder, setSortOrder] = useState("Newest"); // Default: Newest first


  // Check if user is authenticated
  useEffect(() => {
    async function fetchUser() {
      const loggedInUser = await getUser();
      if (!loggedInUser) {
        router.push("/login");
      } else {
        setUser(loggedInUser);
        fetchProjects();
      }
    }
    fetchUser();
  }, []);

  // Fetch projects and their RFIs
  async function fetchProjects() {
    const { data: projectsData, error: projectsError } = await supabase.from("projects").select("*");
    if (projectsError) {
      console.error("Error fetching projects:", projectsError.message);
      return;
    }
    setProjects(projectsData);
  
    // Fetch RFIs for each project
    const { data: rfisData, error: rfisError } = await supabase.from("rfis").select("*");
    if (rfisError) {
      console.error("Error fetching RFIs:", rfisError.message);
      return;
    }
  
    // Organize RFIs by project ID with correct state structure
    const rfisByProject = {};
    rfisData.forEach((rfi) => {
      if (!rfisByProject[rfi.project_id]) {
        rfisByProject[rfi.project_id] = { rfisList: [] };
      }
      rfisByProject[rfi.project_id].rfisList.push(rfi);
    });
  
    setRfis(rfisByProject); // Update state with correctly structured RFIs
  
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
      .insert([{ title, description, project_id: projectId, created_by: user.id, status: "New" }])
      .select("*");
  
    if (error) {
      console.error("Error creating RFI:", error.message);
      return;
    }
  
    console.log("RFI created:", data);
  
    setRfis((prevRfis) => {
      const existingRfis = prevRfis[projectId]?.rfisList || [];
      return {
        ...prevRfis,
        [projectId]: {
          ...prevRfis[projectId],
          rfisList: [...existingRfis, data[0]],
        },
      };
    });
  
    setRfis((prevRfis) => ({
      ...prevRfis,
      [projectId]: {
        ...prevRfis[projectId],
        title: "",
        description: "",
      },
    }));
  };

  // Function to update an RFI's status
  const handleUpdateRFIStatus = async (rfiId, newStatus) => {
    const { error } = await supabase.from("rfis").update({ status: newStatus }).eq("id", rfiId);
  
    if (error) {
      console.error("Error updating RFI status:", error.message);
      return;
    }
  
    console.log("RFI status updated:", newStatus);
  
    // Ensure RFIs are stored as an array before calling .map()
    setRfis((prevRfis) => {
      const updatedRfis = { ...prevRfis };
  
      Object.keys(updatedRfis).forEach((projectId) => {
        if (Array.isArray(updatedRfis[projectId]?.rfisList)) {
          updatedRfis[projectId].rfisList = updatedRfis[projectId].rfisList.map((rfi) =>
            rfi.id === rfiId ? { ...rfi, status: newStatus } : rfi
          );
        }
      });
  
      return updatedRfis;
    });
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
          <div>
  
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
  <div>
    <label style={{ fontWeight: "bold" }}>Filter by Status:</label>
    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ marginLeft: "10px", padding: "5px" }}>
      <option value="All">All</option>
      <option value="New">New</option>
      <option value="Working on it">Working on it</option>
      <option value="Stuck">Stuck</option>
      <option value="Completed">Completed</option>
    </select>
  </div>

  <div>
    <label style={{ fontWeight: "bold" }}>Sort by:</label>
    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ marginLeft: "10px", padding: "5px" }}>
      <option value="Newest">Newest First</option>
      <option value="Oldest">Oldest First</option>
    </select>
  </div>
</div>


<h2 style={{ marginBottom: "10px", fontWeight: "bold" }}>Your Projects</h2>
{projects.length > 0 ? (
  projects.map((project) => (
    <div key={project.id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
      <h3 style={{ color: "#333" }}>{project.name}</h3>
      <p>{project.description}</p>

      <h4 style={{ marginTop: "10px", fontWeight: "bold" }}>Add an RFI</h4>
      <form onSubmit={(e) => handleCreateRFI(e, project.id)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="text" placeholder="RFI Title" value={rfis[project.id]?.title || ""} 
          onChange={(e) =>
            setRfis((prevRfis) => ({
              ...prevRfis,
              [project.id]: { ...(prevRfis[project.id] || { rfisList: [] }), title: e.target.value },
            }))
          }
          required style={{ padding: "8px", borderRadius: "5px" }} 
        />
        <input type="text" placeholder="RFI Description" value={rfis[project.id]?.description || ""} 
          onChange={(e) =>
            setRfis((prevRfis) => ({
              ...prevRfis,
              [project.id]: { ...(prevRfis[project.id] || { rfisList: [] }), description: e.target.value },
            }))
          }
          style={{ padding: "8px", borderRadius: "5px" }} 
        />
        <button type="submit" style={{ backgroundColor: "#28a745", color: "white", padding: "10px", borderRadius: "5px", cursor: "pointer" }}>
          Submit RFI
        </button>
      </form>

      <h4 style={{ marginTop: "15px", fontWeight: "bold" }}>RFIs</h4>
      {rfis[project.id]?.rfisList && rfis[project.id].rfisList.length > 0 ? (
        <ul style={{ listStyle: "none", paddingLeft: "0" }}>
          {rfis[project.id].rfisList
            .filter((rfi) => filterStatus === "All" || rfi.status === filterStatus)
            .sort((a, b) => (sortOrder === "Newest" ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at)))
            .map((rfi) => (
              <li key={rfi.id} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px", marginBottom: "5px" }}>
                <strong>{rfi.title}</strong>: {rfi.description} | Status:{" "}
                <select value={rfi.status} onChange={(e) => handleUpdateRFIStatus(rfi.id, e.target.value)} style={{ marginLeft: "10px", padding: "5px" }}>
                  <option value="New">New</option>
                  <option value="Working on it">Working on it</option>
                  <option value="Stuck">Stuck</option>
                  <option value="Completed">Completed</option>
                </select>
              </li>
            ))}
        </ul>
      ) : (
        <p style={{ color: "gray" }}>No RFIs yet for this project.</p>
      )}
    </div>
  ))
) : (
  <p>No projects found.</p>
)}

          </div>
        </>
      ) : (
        <p>Redirecting to login...</p>
      )}
    </main>
  );
}

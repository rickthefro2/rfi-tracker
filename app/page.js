import supabase from "../lib/supabaseClient";

export default async function Home() {
  const { data: projects, error } = await supabase.from("projects").select("*");

  if (error) {
    console.error("Error fetching projects:", error.message);
    return <p>Error loading projects. Check console.</p>;
  }

  return (
    <main>
      <h1>RFI Tracker 📋</h1>
      <h2>Projects</h2>
      <ul>
        {projects?.length > 0 ? (
          projects.map((project) => (
            <li key={project.id}>
              <strong>{project.name}</strong>: {project.description}
            </li>
          ))
        ) : (
          <p>No projects found.</p>
        )}
      </ul>
    </main>
  );
}
// fetch-groups.ts
import { writeFile } from "fs/promises";

const URL =
  "https://waha-qxjcatc8.sumopod.in/api/session_01jx523c9fdzcaev186szgc67h/groups";

const API_KEY = "nxYLkYFvsjs6BG5j5C6cYK7KpDxuZUQg";

async function main() {
  const res = await fetch(URL, {
    method: "GET",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  await writeFile("groups.json", JSON.stringify(data, null, 2));
}

main().catch(console.error);

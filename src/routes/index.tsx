import { createFileRoute } from "@tanstack/react-router";
import CollabLANApp from "@/components/CollabLANApp";
import AuthGuard from "@/components/AuthGuard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CollabLAN — Offline Collaboration for Hackathon Teams" },
      { name: "description", content: "No internet? No problem. Real-time whiteboard, code editor, chat, file sharing, and task tracking — all over LAN." },
    ],
  }),
});

function Index() {
  return (
    <AuthGuard>
      <CollabLANApp />
    </AuthGuard>
  );
}

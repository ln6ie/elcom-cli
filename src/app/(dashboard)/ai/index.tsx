import { useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
export default function AIHomeRoute() { const router = useRouter(); return <EmptyState title="AI workspace" description="AI is separate from VPS operations. Configure a provider, then open your existing chat workspace." actionLabel="Open AI Chat" onAction={() => router.push("/chat")} />; }

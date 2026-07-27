"use client";

import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/loading-screen";

export default function AuthGate({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
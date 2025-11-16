import SwapView from "@/components/swap/SwapView";

export default function DashboardView() {
    return (
        <main
            className="flex flex-col items-center justify-start min-h-screen bg-background relative px-4 pt-8 overflow-auto">
            <div
                className="w-full max-w-7xl mx-auto flex justify-center bg-background mb-8">
                <SwapView/>
            </div>
        </main>
    );
}

"use client";
import PoolView from "@/components/pool/PoolView";

export default function PoolPage() {
    return (
      <main
        className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground px-4 pt-8 overflow-auto">
          <div className="w-full max-w-7xl mx-auto flex justify-center mb-8">
              <PoolView/>
          </div>
      </main>
    );
}

export default function Hero() {
    return (
        <section className="relative flex items-center justify-center pt-50 pb-8 bg-background">
            <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
                {/* Animated DexAggregator Logo */}
                <div className="flex justify-center mb-6 animate-fade-in-down">
                    <div className="flex items-center gap-4 sm:gap-6">

                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight leading-none">
                            <span className="bg-gradient-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-shift">
                                DexAggregator
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Tagline */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium mb-0 text-muted-foreground">
                    Your Gateway to DeFi
                </h2>
            </div>
        </section>
    );
};

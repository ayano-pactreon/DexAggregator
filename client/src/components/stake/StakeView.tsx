import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

export default function StakeView() {
    return (
        <div className="glass-panel p-6 glow-effect">
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Stake $KPG</h3>
                <p className="text-muted-foreground">Stake tokens to earn rewards and secure the network</p>
            </div>

            <div className="glass-panel p-4 rounded-xl mb-6 bg-primary/5">
                <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">12.5%</div>
                    <div className="text-sm text-muted-foreground">Current APY</div>
                </div>
            </div>

            <div className="glass-input p-4 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                    <Input
                        placeholder="0"
                        className="border-0 bg-transparent text-xl font-semibold p-0 h-auto focus-visible:ring-0"
                    />
                    <Button variant="outline" className="glass-button">
                        <span className="mr-2">KPG</span>
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground mt-2">Available: 0 KPG</div>
            </div>

            <Button
                className="w-full glass-button bg-primary/20 hover:bg-primary/30 text-primary border-primary/30 py-6 text-lg font-semibold glow-effect">
                Stake Tokens
            </Button>
        </div>
    );
};

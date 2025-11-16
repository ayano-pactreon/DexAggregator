"use client";

import Link from "next/link";
import { useState } from "react";
import XLogo from "@/components/commons/XLogo";
import TelegramLogo from "@/components/commons/TelegramLogo";

const SOCIALS = [
    {
        id: "x",
        href: "https://x.com/MandalaChain",
        hoverColor: "#000000",
        defaultColor: "#8993B1",
        Logo: XLogo,
    },
    {
        id: "telegram",
        href: "https://t.me/mandalachain",
        hoverColor: "#24A1DE",
        defaultColor: "#8993B1",
        Logo: TelegramLogo,
    },
];

export function Socials() {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
      <div className="flex items-center gap-4">
          {SOCIALS.map(({ id, href, hoverColor, defaultColor, Logo }) => (
            <Link
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
            >
                <Logo fill={hovered === id ? hoverColor : defaultColor} />
            </Link>
          ))}
      </div>
    );
}

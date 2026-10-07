"use client";

import { motion } from "framer-motion";

export function Header() {
  return (
    <header className="flex items-start justify-between border-b border-[#eadfcd] px-6 py-6 md:px-12">
      <div>
        <p className="font-serif text-[22px] leading-6 tracking-[0.22em] text-[#2c261c] md:text-[26px]">
          SHREEDAVI
        </p>
        <p className="font-serif text-[22px] leading-6 tracking-[0.22em] text-[#2c261c] md:text-[26px]">
          JEWELLERS
        </p>
        <p className="mt-2 text-[10px] font-medium tracking-[0.28em] text-[#9a7b45]">
          AI SALES ASSISTANT
        </p>
      </div>
      <div className="flex items-center gap-2 pt-1 text-[11px] tracking-[0.16em] text-[#4a4338]">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-[#3d8b63]"
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        SYSTEM ONLINE
      </div>
    </header>
  );
}

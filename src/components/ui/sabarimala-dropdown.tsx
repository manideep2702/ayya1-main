"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Option = { label: string; onClick: () => void; Icon?: React.ReactNode };

type DropdownMenuProps = {
  options: Option[];
  children?: React.ReactNode;
  className?: string; // allow host to control trigger styles for integration
};

export default function SabarimalaDropdown({ options, children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative inline-block">
      <Button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "h-8 rounded-full bg-white/15 px-4 text-xs font-medium text-white hover:bg-white/25",
          className
        )}
        suppressHydrationWarning
      >
        {mounted ? (
          <>
            <motion.span whileHover={{ scale: 1.05 }} className="inline-flex items-center gap-2">
              {children ?? "Sabarimala"}
            </motion.span>
            <motion.span className="ml-2" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.4, ease: "easeInOut", type: "spring" }}>
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-2">
              {children ?? "Sabarimala"}
            </span>
            <span className="ml-2">
              <ChevronDown className="h-4 w-4" />
            </span>
          </>
        )}
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -5, scale: 0.95, filter: "blur(10px)" }}
            animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ y: -5, scale: 0.95, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "circInOut", type: "spring" }}
            className="absolute z-10 w-48 mt-2 p-1 bg-[#11111198] rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm flex flex-col gap-2"
          >
            {options?.length ? (
              options.map((option, index) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, x: 10, scale: 0.95, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 10, scale: 0.95, filter: "blur(10px)" }}
                  transition={{ duration: 0.4, delay: index * 0.1, ease: "easeInOut", type: "spring" }}
                  whileHover={{ backgroundColor: "#11111140", transition: { duration: 0.4, ease: "easeInOut" } }}
                  whileTap={{ scale: 0.95, transition: { duration: 0.2, ease: "easeInOut" } }}
                  onClick={() => {
                    option.onClick();
                    setIsOpen(false);
                  }}
                  className="px-2 py-3 cursor-pointer text-white text-sm rounded-lg w-full text-left flex items-center gap-x-2"
                >
                  {option.Icon}
                  {option.label}
                </motion.button>
              ))
            ) : (
              <div className="px-4 py-2 text-white text-xs">No options</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

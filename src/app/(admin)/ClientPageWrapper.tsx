"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function ClientPageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.main 
      key={pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 p-4 md:p-8"
    >
      {children}
    </motion.main>
  );
}
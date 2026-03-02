import { motion } from "framer-motion";
import headerImg from "@/assets/header.webp";
import kybbaImg from "@/assets/kybba.webp";

const HeroSection = () => {
  return (
    <motion.div
      className="flex flex-col items-center text-center relative"
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <img
        src={headerImg}
        alt="City Madness Open Air Festival"
        className="w-full max-w-md mx-auto mb-4"
      />
      <img
        src={kybbaImg}
        alt="KYBBA Live on Stage"
        className="w-full max-w-lg mx-auto"
        style={{ marginTop: "-20px" }}
      />
    </motion.div>
  );
};

export default HeroSection;

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
        className="w-[70%] sm:w-[60%] md:w-[80%] lg:w-full max-w-md mx-auto mb-2 sm:mb-4"
      />
      <img
        src={kybbaImg}
        alt="KYBBA Live on Stage"
        className="w-[85%] sm:w-[75%] md:w-[90%] lg:w-full max-w-lg mx-auto -mt-2 sm:-mt-4 lg:-mt-5"
      />
    </motion.div>
  );
};

export default HeroSection;

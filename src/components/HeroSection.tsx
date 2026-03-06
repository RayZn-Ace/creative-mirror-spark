import { motion } from "framer-motion";
import headerImg from "@/assets/header.png";

const HeroSection = () => {
  return (
    <motion.div
      className="flex flex-col items-center text-center relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <img
        src={headerImg}
        alt="partyticket – Deine Ticketing-Plattform"
        className="w-[80%] sm:w-[70%] md:w-[60%] lg:w-[50%] max-w-xl mx-auto"
      />
    </motion.div>
  );
};

export default HeroSection;

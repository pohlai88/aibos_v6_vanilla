import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Import user-uploaded icons from src/components/icons
import Steve from "./icons/Steve.png";
import SF from "./icons/SF.png";
import Teck from "./icons/Teck.png";
import emerson from "./icons/emerson.png";
import Carrie from "./icons/Carrie.png";
import Austin from "./icons/Austin.png";
import FigmaIcon from "./icons/Figma.png";
import lightIcon from "./icons/light.png";
import Group26Icon from "./icons/Group 26.png";
import Group30Icon from "./icons/Group 30.png";
import Group3Icon from "./icons/Group 3.png";
import Group13Icon from "./icons/Group 13.png";
import YouTubeIcon from "./icons/YouTube.png";
import InstagramIcon from "./icons/Instagram.png";
import GitHubIcon from "./icons/GitHub.png";
import linkIcon from "./icons/link-dynamic-gradient.png";
import wifiIcon from "./icons/wifi-dynamic-gradient.png";
import hashIcon from "./icons/hash-dynamic-color.png";
import blenderIcon from "./icons/blender-dynamic-color.png";
import shieldIcon from "./icons/sheild-dynamic-color.png";
import atIcon from "./icons/at-dynamic-color.png";
import boyAvatar from "./icons/Avatars (1).png";
import girlAvatar from "./icons/Avatars.png";
// New icons
import dlbBear from "./icons/dlb bear.png";
import dlbLogo from "./icons/dlb logo.png";
import oyenLogo from "./icons/oyen logo.jpg";
import dapoSantai from "./icons/DAPO SANTAI.png";
// Additional icons without background
import quickAddIcon from "./icons/quick add.png";
import rca2 from "./icons/rca 2.png";
import footerIcon from "./icons/FOOTER.png";

// Restore the original icons array with all imported icons
const icons = [
  Steve,
  SF,
  Teck,
  emerson,
  Carrie,
  Austin,
  FigmaIcon,
  lightIcon,
  Group26Icon,
  Group30Icon,
  Group3Icon,
  Group13Icon,
  YouTubeIcon,
  InstagramIcon,
  GitHubIcon,
  linkIcon,
  wifiIcon,
  hashIcon,
  blenderIcon,
  shieldIcon,
  atIcon,
  boyAvatar,
  girlAvatar,
  // New icons added
  dlbBear,
  dlbLogo,
  oyenLogo,
  dapoSantai,
  // Additional icons without background
  quickAddIcon,
  rca2,
  footerIcon,
];

const ICON_SIZE = 56; // px (w-14 h-14)
const ICON_SIZE_MD = 80; // px (w-20 h-20)
const FLY_RADIUS = 120; // px
const FLY_RADIUS_MD = 180; // px

const HeroSection: React.FC = () => {
  const [isMd, setIsMd] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const onResize = () => setIsMd(window.innerWidth >= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const iconSize = isMd ? ICON_SIZE_MD : ICON_SIZE;
  const flyRadius = isMd ? FLY_RADIUS_MD : FLY_RADIUS;
  const clusterBoxHeight = iconSize * 3;

  // Animate time for flying icons (slower motion)
  const [time, setTime] = useState(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now;
      }
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setTime((t) => {
        const newTime = t + delta * 0.00045; // much slower
        // Debug: log every 60 frames (roughly once per second)
        if (Math.floor(newTime * 100) % 60 === 0) {
          console.log("Animation time:", newTime.toFixed(3));
        }
        return newTime;
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, []);

  // All icons are now animated equally
  const orbitIcons = icons;

  // Generate unique random offsets and min/max scale for each flying icon
  const iconMotionParams = React.useMemo(
    () =>
      orbitIcons.map(() => ({
        pathOffset: Math.random() * Math.PI * 2,
        scaleOffset: Math.random() * Math.PI * 2,
        minScale: 0.7 + Math.random() * 0.1, // 0.7 - 0.8
        maxScale: 1.15 + Math.random() * 0.15, // 1.15 - 1.3
      })),
    [orbitIcons.length]
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-white overflow-x-hidden">
      {/* Icon cluster - higher up */}
      <div
        className="relative flex flex-col items-center justify-center mt-32 mb-8"
        style={{ height: clusterBoxHeight, width: iconSize * 3 }}
      >
        {/* Flying/bouncing icons */}
        {orbitIcons.map((icon, i) => {
          // Each icon gets a unique path and timing
          const params = iconMotionParams[i];
          const baseAngle = ((2 * Math.PI) / orbitIcons.length) * i;
          // Add more randomness to the bouncing path
          const angle =
            baseAngle +
            params.pathOffset +
            Math.sin(time * (0.5 + i * 0.07) + params.pathOffset) * 0.9 +
            time * (0.09 + i * 0.025);
          const radius =
            flyRadius +
            Math.sin(time * (0.7 + i * 0.11) + i * 1.3 + params.pathOffset) *
              32 +
            Math.cos(time * (0.5 + i * 0.09) + i * 0.7 + params.pathOffset) *
              18;
          const x = Math.cos(angle) * radius;
          let y = Math.sin(angle) * radius - iconSize; // shift cluster up so icons don't overlap text
          // Clamp y so icons never bounce outside the cluster box
          const minY = -clusterBoxHeight / 2 + iconSize / 2;
          const maxY = clusterBoxHeight / 2 - iconSize / 2;
          y = Math.max(minY, Math.min(maxY, y));
          // Unique scale animation for each icon
          const scale =
            params.minScale +
            (params.maxScale - params.minScale) *
              (0.5 +
                0.5 * Math.sin(time * (0.5 + i * 0.13) + params.scaleOffset));
          const isAvatar = icon === girlAvatar || icon === boyAvatar;
          const isFooter = icon === footerIcon;
          const isNoBackground =
            icon === dlbBear ||
            icon === dlbLogo ||
            icon === atIcon ||
            icon === blenderIcon ||
            icon === Group30Icon ||
            icon === Group13Icon ||
            icon === Group3Icon ||
            icon === GitHubIcon ||
            icon === FigmaIcon ||
            icon === hashIcon ||
            icon === InstagramIcon ||
            icon === shieldIcon ||
            icon === YouTubeIcon ||
            icon === wifiIcon ||
            icon === quickAddIcon ||
            icon === rca2;
          return isFooter ? (
            <motion.img
              key={i}
              className="absolute z-20"
              src={icon}
              alt="Footer Icon"
              style={{
                left: "50%",
                top: "50%",
                width: iconSize * 1.2, // Slightly larger for better visibility
                height: iconSize * 1.2,
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`,
                objectFit: "contain", // Use contain to preserve aspect ratio
                willChange: "transform",
                pointerEvents: "auto",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))", // Add subtle shadow
              }}
              whileHover={{
                scale: 1.2,
                // Removed filter animation to avoid invalid keyframe values
                transition: { duration: 0.2 },
              }}
              transition={{ duration: 0.1 }}
            />
          ) : isAvatar || isNoBackground ? (
            <motion.img
              key={i}
              className="absolute z-20"
              src={icon}
              alt={`Icon ${i}`}
              style={{
                left: "50%",
                top: "50%",
                width: iconSize,
                height: iconSize,
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`,
                objectFit: "cover",
                willChange: "transform",
                pointerEvents: "auto",
              }}
              whileHover={{
                scale: 1.15,
                filter: "brightness(1.1)",
                transition: { duration: 0.2 },
              }}
              transition={{ duration: 0.1 }}
            />
          ) : (
            <motion.div
              key={i}
              className="absolute z-20"
              style={{
                left: "50%",
                top: "50%",
                width: iconSize,
                height: iconSize,
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`,
                borderRadius: "9999px",
                background: "white",
                boxShadow: "0 2px 12px 0 rgba(0,0,0,0.10)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                willChange: "transform",
                pointerEvents: "auto",
              }}
              whileHover={{
                scale: 1.15,
                filter: "brightness(1.1)",
                transition: { duration: 0.2 },
              }}
              transition={{ duration: 0.1 }}
            >
              <img
                src={icon}
                alt={`Icon ${i}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </motion.div>
          );
        })}
      </div>
      {/* Main content below cluster - further down */}
      <div className="flex flex-col items-center justify-center w-full px-4 mt-16">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
          AI-BOS
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-light mb-8 text-center max-w-2xl">
          Because life's messy. Work doesn't have to be.
        </p>
        <motion.button
          className="px-12 py-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
          whileHover={{ scale: 1.05, y: -2, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/login")}
        >
          Connect
        </motion.button>
      </div>
    </div>
  );
};

export default HeroSection;

export const motionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  pulse: { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 2 } }
};
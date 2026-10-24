import { LazyMotion } from "motion/react";

const loadFeatures = () => import("@/components/animate/features").then((res) => res.default);

export default function MotionLazyContainer({ children }) {
  return (
    <LazyMotion strict features={loadFeatures}>
      {children}
    </LazyMotion>
  );
}

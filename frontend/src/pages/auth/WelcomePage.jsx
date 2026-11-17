import Closing from "@/sections/welcome/Closing";
import Faq from "@/sections/welcome/Faq";
import Features from "@/sections/welcome/Features";
import Games from "@/sections/welcome/Games";
import Hero from "@/sections/welcome/Hero";
import MotionLazyContainer from "@/components/animate/MotionLazyContainer";
import SitePage from "@/components/SitePage";

const WelcomePage = () => (
  <SitePage>
    <MotionLazyContainer>
      <Hero />
      <Games />
      <Features />
      <Faq />
      <Closing />
    </MotionLazyContainer>
  </SitePage>
);

export default WelcomePage;

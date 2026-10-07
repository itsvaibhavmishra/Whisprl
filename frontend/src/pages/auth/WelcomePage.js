import Closing from "@/sections/welcome/Closing";
import Faq from "@/sections/welcome/Faq";
import Features from "@/sections/welcome/Features";
import Hero from "@/sections/welcome/Hero";
import MernStack from "@/sections/welcome/MernStack";
import SitePage from "@/components/SitePage";

const WelcomePage = () => (
  <SitePage>
    <Hero />
    <Features />
    <MernStack />
    <Faq />
    <Closing />
  </SitePage>
);

export default WelcomePage;

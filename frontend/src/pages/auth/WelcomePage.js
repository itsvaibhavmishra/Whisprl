import Closing from "@/components/PageComponents/WelcomePage/Closing";
import Faq from "@/components/PageComponents/WelcomePage/Faq";
import Features from "@/components/PageComponents/WelcomePage/Features";
import Hero from "@/components/PageComponents/WelcomePage/Hero";
import MernStack from "@/components/PageComponents/WelcomePage/MernStack";
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

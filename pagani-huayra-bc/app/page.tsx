import Navbar from "@/components/Navbar";
import HuayraExperience from "@/components/HuayraExperience";
import StorySection from "@/components/StorySection";
import DesignSection from "@/components/DesignSection";
import EngineeringSection from "@/components/EngineeringSection";
import SpecsGrid from "@/components/SpecsGrid";
import CraftsmanshipSection from "@/components/CraftsmanshipSection";
import FeaturesSection from "@/components/FeaturesSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <HuayraExperience />
        <StorySection />
        <DesignSection />
        <EngineeringSection />
        <SpecsGrid />
        <CraftsmanshipSection />
        <FeaturesSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

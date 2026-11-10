import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LandingHero from "../../components/landing/LandingHero";
import LandingCampaigns from "../../components/landing/LandingCampaigns";
import LandingContact from "../../components/landing/LandingContact";

export default function Home() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
  }, [hash]);
  return (
    <>
      <LandingHero />
      <LandingCampaigns />
      <LandingContact />
    </>
  );
}

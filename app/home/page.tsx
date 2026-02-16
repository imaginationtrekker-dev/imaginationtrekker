"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FAQ from "../components/FAQ";
import FloatingButtons from "../components/FloatingButtons";
import Testimonials from "../components/Testimonials";
import WhyChooseUs from "../components/WhyChooseUs";
import Gallery from "../components/Gallery";
import Banner from "./Banner";
import ImageMarquee from "./ImageMarquee";
import PackagesSlider from "./PackagesSlider";
import Recognitions from "./Recognitions";
import ContactModal from "../components/ContactModal";

export default function Home() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    // Open contact modal after 10 seconds
    const timer = setTimeout(() => {
      setIsContactModalOpen(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative">
      <Header />
      <Banner />
      <ImageMarquee />
      <PackagesSlider />
      <WhyChooseUs />
      <Testimonials />
      <Gallery />
      <FAQ />
      <Recognitions />
      <Footer />
      <FloatingButtons />
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </main>
  );
}
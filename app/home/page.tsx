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

export default function Home() {
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
      <Footer />
      <FloatingButtons />
    </main>
  );
}
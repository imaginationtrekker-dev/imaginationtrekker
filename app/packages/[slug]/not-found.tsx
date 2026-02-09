import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function PackageNotFound() {
  return (
    <main className="relative">
      <Header />
      <section className="package-not-found-section">
        <div className="package-not-found-container">
          <h1 className="package-not-found-title">Package Not Found</h1>
          <p className="package-not-found-message">
            The package you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/packages" className="package-not-found-link">
            Browse All Packages
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

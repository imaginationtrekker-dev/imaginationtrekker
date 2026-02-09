import { notFound } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FloatingButtons from "@/app/components/FloatingButtons";
import PackageDetails from "./PackageDetails";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import "@/app/home/style.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PackagePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: packageData, error } = await supabase
    .from("packages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !packageData) {
    notFound();
  }

  return (
    <main className="relative">
      <Header />
      <PackageDetails packageData={packageData} />
      <Footer />
      <FloatingButtons />
    </main>
  );
}

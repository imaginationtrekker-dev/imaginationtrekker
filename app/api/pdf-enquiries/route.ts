import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("pdf_enquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,whatsapp.ilike.%${search}%,email.ilike.%${search}%,package_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Error fetching PDF enquiries:", error);
      return NextResponse.json(
        { error: "Failed to fetch PDF enquiries" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/pdf-enquiries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

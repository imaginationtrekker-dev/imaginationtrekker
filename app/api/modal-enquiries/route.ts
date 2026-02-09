import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, whatsapp, message } = body;

    // Validation
    if (!fullName || !whatsapp || !message) {
      return NextResponse.json(
        { error: "Full name, WhatsApp number, and message are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Insert enquiry into database
    const { data, error } = await supabase
      .from("modal_enquiries")
      .insert([
        {
          full_name: fullName.trim(),
          whatsapp: whatsapp.trim(),
          message: message.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting modal enquiry:", error);
      return NextResponse.json(
        { error: "Failed to submit enquiry. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Thank you! We'll get back to you within 24 hours.",
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/modal-enquiries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // This GET route is for admin viewing enquiries - keep it authorized
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabase
      .from("modal_enquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply search filter if provided
    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search}%,whatsapp.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    // Get total count and data
    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Error fetching modal enquiries:", error);
      return NextResponse.json(
        { error: "Failed to fetch enquiries" },
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
  } catch (error: any) {
    console.error("Error in GET /api/modal-enquiries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

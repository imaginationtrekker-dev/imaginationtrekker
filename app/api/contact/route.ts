import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { fullName, email, phone, whatsapp, message } = body;

    // Validation
    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: "Full name, email, and message are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Insert contact enquiry
    const { data, error } = await supabase
      .from("contact_enquiries")
      .insert([
        {
          full_name: fullName,
          email: email,
          phone: phone || null,
          whatsapp: whatsapp || null,
          message: message,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting contact enquiry:", error);
      return NextResponse.json(
        { error: "Failed to submit enquiry. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! We'll get back to you within 24 hours.",
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in contact API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // This GET route is for admin viewing contact enquiries - keep it authorized
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchQuery = searchParams.get("search") || "";

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { error: "Page number must be greater than 0" },
        { status: 400 }
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Page size must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabase
      .from("contact_enquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply search filter
    if (searchQuery) {
      query = query.or(
        `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,whatsapp.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching contact enquiries:", error);
      return NextResponse.json(
        { error: "Failed to fetch enquiries" },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / pageSize) : 0;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error: any) {
    console.error("Error in contact GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

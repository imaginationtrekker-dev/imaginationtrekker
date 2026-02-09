import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Required parameter
    const pageNumber = parseInt(searchParams.get('pageNumber') || '1', 10);
    const itemsPerPage = 12;
    const offset = (pageNumber - 1) * itemsPerPage;

    // Optional filters
    const searchQuery = searchParams.get('searchQuery') || '';
    const sortBy = searchParams.get('sortBy') || 'date-desc'; // title-asc, title-desc, date-asc, date-desc
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const minDuration = searchParams.get('minDuration') ? parseInt(searchParams.get('minDuration')!, 10) : null;
    const maxDuration = searchParams.get('maxDuration') ? parseInt(searchParams.get('maxDuration')!, 10) : null;
    const difficulty = searchParams.get('difficulty') || '';

    // Create a public Supabase client for anonymous access (no auth required)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Start building the query
    let query = supabase
      .from('packages')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (searchQuery) {
      query = query.or(`package_name.ilike.%${searchQuery}%,package_description.ilike.%${searchQuery}%`);
    }

    // Apply price range filter
    if (minPrice !== null) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== null) {
      query = query.lte('price', maxPrice);
    }
    // Also check discounted_price
    if (minPrice !== null || maxPrice !== null) {
      // This is a bit complex - we need to check both price and discounted_price
      // For now, we'll filter by price and handle discounted_price in the response
    }

    // Apply difficulty filter
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Apply sorting
    switch (sortBy) {
      case 'title-asc':
        query = query.order('package_name', { ascending: true });
        break;
      case 'title-desc':
        query = query.order('package_name', { ascending: false });
        break;
      case 'date-asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'date-desc':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Don't apply pagination yet - we need to filter first
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching packages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch packages', details: error.message },
        { status: 500 }
      );
    }

    // Calculate duration from itinerary and filter by duration
    let filteredData = (data || []).map((pkg: any) => {
      let duration = 0;
      if (pkg.itinerary && Array.isArray(pkg.itinerary)) {
        // Count unique days in itinerary
        const daySet = new Set<string>();
        pkg.itinerary.forEach((item: any) => {
          if (item.heading) {
            // Extract day number from heading (e.g., "Day 1", "Day 2")
            const dayMatch = item.heading.match(/day\s+(\d+)/i);
            if (dayMatch) {
              daySet.add(dayMatch[1]);
            }
          }
        });
        duration = daySet.size || pkg.itinerary.length;
      }
      return {
        ...pkg,
        calculated_duration: duration || (pkg.package_duration ? parseInt(pkg.package_duration.match(/\d+/)?.[0] || '0', 10) : 0)
      };
    });

    // Filter by duration range
    if (minDuration !== null || maxDuration !== null) {
      filteredData = filteredData.filter((pkg: any) => {
        const duration = pkg.calculated_duration;
        if (minDuration !== null && duration < minDuration) return false;
        if (maxDuration !== null && duration > maxDuration) return false;
        return true;
      });
    }

    // Also filter by discounted_price for price range
    if (minPrice !== null || maxPrice !== null) {
      filteredData = filteredData.filter((pkg: any) => {
        const price = pkg.discounted_price || pkg.price;
        if (!price) return false;
        if (minPrice !== null && price < minPrice) return false;
        if (maxPrice !== null && price > maxPrice) return false;
        return true;
      });
    }

    // Apply pagination after filtering
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = filteredData.slice(offset, offset + itemsPerPage);

    return NextResponse.json({
      packages: paginatedData,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        itemsPerPage,
        totalItems,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error: any) {
    console.error('Error in packages API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, whatsapp, email, pdfUrl, packageName } = body;

    if (!fullName || !whatsapp || !email || !pdfUrl) {
      return NextResponse.json(
        { error: "Name, WhatsApp number, email, and PDF URL are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587", 10),
      secure: smtpPort === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const packageLabel = packageName ? ` for ${packageName}` : "";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d5a6f;">Your Package Document${packageLabel}</h2>
        <p>Hi ${fullName},</p>
        <p>Thank you for your interest! As requested, here is the link to download the package PDF document:</p>
        <p style="margin: 24px 0;">
          <a href="${pdfUrl}" style="display: inline-block; padding: 12px 24px; background: #0d5a6f; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Download PDF Document
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${pdfUrl}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Imagination Trekker - Your adventure awaits!
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: email,
      subject: `Your Package Document${packageLabel} - Imagination Trekker`,
      html: htmlContent,
      text: `Hi ${fullName},\n\nHere is your package document link: ${pdfUrl}\n\n- Imagination Trekker`,
    });

    // Save successful enquiry to database
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("pdf_enquiries").insert([
        {
          full_name: fullName.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          pdf_url: pdfUrl,
          package_name: packageName?.trim() || null,
        },
      ]);
    } catch (dbError) {
      console.error("Failed to save PDF enquiry to database:", dbError);
      // Don't fail the request - email was sent successfully
    }

    return NextResponse.json(
      {
        success: true,
        message: "PDF link has been sent to your email. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error sending PDF link email:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send email. Please try again.",
      },
      { status: 500 }
    );
  }
}

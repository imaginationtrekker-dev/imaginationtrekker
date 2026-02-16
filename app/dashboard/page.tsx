import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const dashboardCards = [
    {
      title: 'FAQs',
      description: 'Manage frequently asked questions and help content.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <circle cx='12' cy='12' r='10'></circle>
          <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'></path>
          <path d='M12 17h.01'></path>
        </svg>
      ),
      href: '/dashboard/faqs',
    },
    {
      title: 'Testimonials',
      description: 'Manage customer testimonials and reviews.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
          <path d='M8 10h8'></path>
          <path d='M8 14h6'></path>
        </svg>
      ),
      href: '/dashboard/testimonials',
    },
    {
      title: 'Bookings',
      description: 'View and manage all customer bookings.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect width='18' height='18' x='3' y='4' rx='2'></rect>
          <line x1='16' x2='16' y1='2' y2='6'></line>
          <line x1='8' x2='8' y1='2' y2='6'></line>
          <line x1='3' x2='21' y1='10' y2='10'></line>
        </svg>
      ),
      href: '/dashboard/bookings',
    },
    {
      title: 'Enquiries',
      description: 'Manage customer enquiries and support requests.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect width='20' height='16' x='2' y='4' rx='2'></rect>
          <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'></path>
        </svg>
      ),
      href: '/dashboard/enquiries',
    },
    {
      title: 'Contact Enquiries',
      description: 'Manage contact form submissions and inquiries.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
        </svg>
      ),
      href: '/dashboard/contact-enquiries',
    },
    {
      title: 'Modal Enquiries',
      description: 'Manage enquiries from package modal forms.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect width='18' height='18' x='3' y='3' rx='2' ry='2'></rect>
          <path d='M9 9h6'></path>
          <path d='M9 12h6'></path>
          <path d='M9 15h4'></path>
        </svg>
      ),
      href: '/dashboard/modal-enquiries',
    },
    {
      title: 'PDF Enquiries',
      description: 'View successful PDF download requests.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
          <polyline points='14 2 14 8 20 8'></polyline>
          <line x1='16' x2='8' y1='13' y2='13'></line>
          <line x1='16' x2='8' y1='17' y2='17'></line>
          <polyline points='10 9 9 9 8 9'></polyline>
        </svg>
      ),
      href: '/dashboard/pdf-enquiries',
    },
    {
      title: 'Gallery',
      description: 'Upload, edit, and organize your image gallery.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect width='18' height='18' x='3' y='3' rx='2' ry='2'></rect>
          <circle cx='9' cy='9' r='2'></circle>
          <path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'></path>
        </svg>
      ),
      href: '/dashboard/gallery',
    },
    {
      title: 'Packages',
      description: 'Manage and track all your travel packages.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'></path>
          <circle cx='12' cy='10' r='3'></circle>
        </svg>
      ),
      href: '/dashboard/packages',
    },
    {
      title: 'Why Choose Us',
      description: 'Manage the Why Choose Us section on the home page.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'></path>
          <path d='M9 12l2 2 4-4'></path>
        </svg>
      ),
      href: '/dashboard/why-choose-us',
    },
    {
      title: 'Privacy Policy',
      description: 'Manage your privacy policy content.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <rect width='18' height='18' x='3' y='3' rx='2'></rect>
          <path d='M9 9h6'></path>
          <path d='M9 12h6'></path>
          <path d='M9 15h4'></path>
        </svg>
      ),
      href: '/dashboard/privacy-policy',
    },
    {
      title: 'Terms & Conditions',
      description: 'Manage your terms and conditions content.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
          <polyline points='14 2 14 8 20 8'></polyline>
          <line x1='16' x2='8' y1='13' y2='13'></line>
          <line x1='16' x2='8' y1='17' y2='17'></line>
          <polyline points='10 9 9 9 8 9'></polyline>
        </svg>
      ),
      href: '/dashboard/terms-and-conditions',
    },
    {
      title: 'Cancellation Policy',
      description: 'Manage your cancellation policy content.',
      icon: (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#0d5a6f' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <circle cx='12' cy='12' r='10'></circle>
          <path d='M12 6v6'></path>
          <path d='M12 16h.01'></path>
        </svg>
      ),
      href: '/dashboard/cancellation-policy',
    },
  ];

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Welcome to Imagination Trekker</h3>
        <p>Manage your travel packages, bookings, and content.</p>
      </div>

      <div className='features_row'>
        {dashboardCards.map((card, index) => (
          <Link key={index} href={card.href} className='features_col'>
            <span className='features_icon'>{card.icon}</span>
            <div className='features_content'>
              <h4>{card.title}</h4>
              <p>{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

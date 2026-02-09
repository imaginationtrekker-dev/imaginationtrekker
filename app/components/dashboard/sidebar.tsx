'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className='sidebar'>
      <div className='logo'>
        <Image
          src='/images/logo-old.png'
          alt='Imagination Trekker'
          width={140}
          height={40}
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className='sidebar_menu'>
        {/* Dashboard Main */}
        <Link href='/dashboard' className={`sidebar_item ${pathname === '/dashboard' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <rect width='7' height='9' x='3' y='3' rx='1'></rect>
              <rect width='7' height='5' x='14' y='3' rx='1'></rect>
              <rect width='7' height='9' x='14' y='12' rx='1'></rect>
              <rect width='7' height='5' x='3' y='16' rx='1'></rect>
            </svg>
            <span>Dashboard</span>
          </div>
        </Link>

        {/* HOME Section */}
        <div className='sidebar_section'>
          <span className='sidebar_section_title'>HOME</span>
        </div>

        {/* FAQs */}
        <Link href='/dashboard/faqs' className={`sidebar_item ${pathname === '/dashboard/faqs' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='12' cy='12' r='10'></circle>
              <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'></path>
              <path d='M12 17h.01'></path>
            </svg>
            <span>FAQs</span>
          </div>
        </Link>

        {/* Testimonials */}
        <Link href='/dashboard/testimonials' className={`sidebar_item ${pathname === '/dashboard/testimonials' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
              <path d='M8 10h8'></path>
              <path d='M8 14h6'></path>
            </svg>
            <span>Testimonials</span>
          </div>
        </Link>

        {/* ACTIVITY Section */}
        <div className='sidebar_section'>
          <span className='sidebar_section_title'>ACTIVITY</span>
        </div>

        {/* Bookings */}
        <Link href='/dashboard/bookings' className={`sidebar_item ${pathname === '/dashboard/bookings' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <rect width='18' height='18' x='3' y='4' rx='2'></rect>
              <line x1='16' x2='16' y1='2' y2='6'></line>
              <line x1='8' x2='8' y1='2' y2='6'></line>
              <line x1='3' x2='21' y1='10' y2='10'></line>
            </svg>
            <span>Bookings</span>
          </div>
        </Link>

        {/* Enquiries */}
        <Link href='/dashboard/enquiries' className={`sidebar_item ${pathname === '/dashboard/enquiries' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <rect width='20' height='16' x='2' y='4' rx='2'></rect>
              <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'></path>
            </svg>
            <span>Enquiries</span>
          </div>
        </Link>

        {/* Contact Enquiries */}
        <Link href='/dashboard/contact-enquiries' className={`sidebar_item ${pathname === '/dashboard/contact-enquiries' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
            </svg>
            <span>Contact Enquiries</span>
          </div>
        </Link>

        {/* Modal Enquiries */}
        <Link href='/dashboard/modal-enquiries' className={`sidebar_item ${pathname === '/dashboard/modal-enquiries' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <rect width='18' height='18' x='3' y='3' rx='2' ry='2'></rect>
              <path d='M9 9h6'></path>
              <path d='M9 12h6'></path>
              <path d='M9 15h4'></path>
            </svg>
            <span>Modal Enquiries</span>
          </div>
        </Link>


        {/* Gallery */}
        <Link href='/dashboard/gallery' className={`sidebar_item ${pathname === '/dashboard/gallery' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <rect width='18' height='18' x='3' y='3' rx='2' ry='2'></rect>
              <circle cx='9' cy='9' r='2'></circle>
              <path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'></path>
            </svg>
            <span>Gallery</span>
          </div>
        </Link>

        {/* Packages */}
        <Link href='/dashboard/packages' className={`sidebar_item ${pathname === '/dashboard/packages' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'></path>
              <circle cx='12' cy='10' r='3'></circle>
            </svg>
            <span>Packages</span>
          </div>
        </Link>

        {/* Policies Section */}
        <div className='sidebar_section'>
          <span className='sidebar_section_title'>Policies</span>
        </div>

        {/* Privacy Policy */}
        <Link href='/dashboard/privacy-policy' className={`sidebar_item ${pathname === '/dashboard/privacy-policy' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <rect width='18' height='18' x='3' y='3' rx='2'></rect>
              <path d='M9 9h6'></path>
              <path d='M9 12h6'></path>
              <path d='M9 15h4'></path>
            </svg>
            <span>Privacy Policy</span>
          </div>
        </Link>

        {/* Terms and Conditions */}
        <Link href='/dashboard/terms-and-conditions' className={`sidebar_item ${pathname === '/dashboard/terms-and-conditions' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
              <polyline points='14 2 14 8 20 8'></polyline>
              <line x1='16' x2='8' y1='13' y2='13'></line>
              <line x1='16' x2='8' y1='17' y2='17'></line>
              <polyline points='10 9 9 9 8 9'></polyline>
            </svg>
            <span>Terms & Conditions</span>
          </div>
        </Link>

        {/* Cancellation Policy */}
        <Link href='/dashboard/cancellation-policy' className={`sidebar_item ${pathname === '/dashboard/cancellation-policy' ? 'active' : ''}`}>
          <div className='sidebar_item_content'>
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='12' cy='12' r='10'></circle>
              <path d='M12 6v6'></path>
              <path d='M12 16h.01'></path>
            </svg>
            <span>Cancellation Policy</span>
          </div>
        </Link>

      </div>
    </div>
  );
}

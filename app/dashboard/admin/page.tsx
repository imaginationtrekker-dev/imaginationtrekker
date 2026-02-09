import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <h3>Admin Dashboard</h3>
        <p>Manage all aspects of Imagination Trekker.</p>
      </div>

      <div className='features_row'>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path>
              <circle cx='9' cy='7' r='4'></circle>
              <path d='m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828l2.828 2.828Z'></path>
              <circle cx='18' cy='8' r='2'></circle>
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Users <span className='badge'>Admin</span>
            </h4>
            <p>Manage user accounts and permissions.</p>
          </div>
        </div>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M16.5 9.4 7.55 4.24'></path>
              <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
              <polyline points='3.29 7 12 12 20.71 7'></polyline>
              <line x1='12' x2='12' y1='22' y2='12'></line>
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Packages <span className='badge'>Admin</span>
            </h4>
            <p>Create and manage travel packages.</p>
          </div>
        </div>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect width='20' height='16' x='2' y='4' rx='2'></rect>
              <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'></path>
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Enquiries <span className='badge'>Admin</span>
            </h4>
            <p>View and respond to customer enquiries.</p>
          </div>
        </div>
        <div className='features_col'>
          <span className='features_icon'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'></path>
              <circle cx='12' cy='12' r='3'></circle>
            </svg>
          </span>
          <div className='features_content'>
            <h4>
              Settings <span className='badge'>Admin</span>
            </h4>
            <p>Configure system settings and preferences.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

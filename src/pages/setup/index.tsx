import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SetupIndex() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSetupStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Check if DcisionAI API key is configured
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!userSettings?.dcai_api_key) {
        router.push('/setup/apikey');
        return;
      }

      // Only require API key step for now
      router.push('/dashboard');
      return;
    };

    checkSetupStatus();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg text-[#8E8E93]">Loading setup...</p>
      </div>
    </div>
  );
} 
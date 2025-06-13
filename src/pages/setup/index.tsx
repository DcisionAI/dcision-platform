import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SetupIndex() {
  const router = useRouter();

  useEffect(() => {
    const checkSetupStatus = async () => {
      const apiKey = localStorage.getItem('dcisionai_api_key');
      
      if (!apiKey) {
        router.push('/setup/apikey');
        return;
      }

      router.push('/dashboard');
    };

    checkSetupStatus();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg text-[#8E8E93]">Loading setup...</p>
      </div>
    </div>
  );
} 
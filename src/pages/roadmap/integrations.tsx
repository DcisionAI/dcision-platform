import DataPluginsPage from '@/components/DataPluginsPage';
import Layout from '@/components/Layout';

export default function Integrations() {
  return (
    <Layout>
      <div className="p-6" style={{ backgroundColor: 'rgba(16,17,17,0.93)' }}>
        <div className="bg-[rgb(22_27_34_/var(--tw-bg-opacity,1))] p-4 rounded">
          <DataPluginsPage />
        </div>
      </div>
    </Layout>
  );
}
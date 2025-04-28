import React from 'react';
import Layout from '@/components/Layout';
import Playground from '../components/playground/Playground';

export default function PlaygroundPage() {
  return (
    <Layout>
      <div className="h-full">
        <Playground />
      </div>
    </Layout>
  );
} 
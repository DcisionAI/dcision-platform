import fs from 'fs';
import path from 'path';
import { GetStaticProps } from 'next';
import { useRef } from 'react';
import Layout from '@/components/Layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';



interface ApiRefProps {
  content: string;
}

export const getStaticProps: GetStaticProps<ApiRefProps> = async () => {
  const mdPath = path.join(process.cwd(), 'docs', 'api', 'README.md');
  const content = fs.readFileSync(mdPath, 'utf-8');
  return { props: { content } };
};

// Parse Markdown headings into a list for the page TOC
function extractHeadings(markdown: string) {
  const lines = markdown.split('\n');
  const headings: { level: number; text: string; id: string }[] = [];
  let inCode = false;
  for (const line of lines) {
    if (/^```/.test(line)) { inCode = !inCode; continue; }
    if (inCode) continue;
    const m = line.match(/^(#{1,4})\s+(.*)/);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim().replace(/[`*_~]/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level, text, id });
    }
  }
  return headings;
}

// Sidebar TOC for API Reference page
function PageTOC({ headings, onClick }: { headings: { level: number; text: string; id: string }[]; onClick: (id: string) => void }) {
  return (
    <aside className="bg-docs-sidebar border-r border-docs-section-border min-h-screen sticky top-16 w-64 p-6 overflow-auto">
      <div className="text-xs text-docs-muted font-bold mb-4 uppercase tracking-wider">On This Page</div>
      <ul className="space-y-2">
        {headings.map(h => (
          <li key={h.id} style={{ marginLeft: (h.level - 1) * 12 }}>
            <button
              onClick={() => onClick(h.id)}
              className="text-docs-text hover:text-docs-accent text-sm transition text-left w-full"
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function ApiReference({ content }: ApiRefProps) {
  const contentRefs = useRef<Record<string, HTMLHeadingElement | null>>({});
  const headings = extractHeadings(content);

  const handleScroll = (id: string) => {
    const el = contentRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Custom heading renderer to attach ids and refs
  const components = {
    h1: ({ children }: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        <h1 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-2xl font-bold mt-8 mb-3 text-docs-text">
          {children}
        </h1>
      );
    },
    h2: ({ children }: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        <h2 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-xl font-semibold mt-6 mb-2 text-docs-text">
          {children}
        </h2>
      );
    },
    h3: ({ children }: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        <h3 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-lg font-semibold mt-4 mb-2 text-docs-text">
          {children}
        </h3>
      );
    },
    h4: ({ children }: any) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        <h4 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-base font-semibold mt-3 mb-2 text-docs-text">
          {children}
        </h4>
      );
    }
  };

  return (
    <Layout sidebarOverride={<PageTOC headings={headings} onClick={handleScroll} />}>
      <div className="openai-docs-dark relative pt-8 pb-8">
        <div className="max-w-6xl mx-auto px-6 text-sm font-sans">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </Layout>
  );
}
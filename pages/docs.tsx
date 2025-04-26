import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/Layout';
import type { Components } from 'react-markdown';

// Utility to fetch all docs content from the backend
async function fetchDocs() {
  const files = [
    'mcp/README.md',
    'mcp/interfaces.md',
    'mcp/migration.md',
    'mcp/api/README.md',
    'mcp/examples/README.md',
  ];
  
  console.log('Attempting to fetch docs for files:', files);
  
  const docs = await Promise.all(
    files.map(async (file) => {
      try {
        console.log(`Fetching ${file}...`);
        const res = await fetch(`/api/docs?file=${encodeURIComponent(file)}`);
        if (!res.ok) {
          console.error(`Failed to fetch ${file}:`, res.status, await res.text());
          return null;
        }
        const data = await res.json();
        console.log(`Successfully fetched ${file}`);
        return { file: data.file, content: data.content };
      } catch (error) {
        console.error(`Error fetching ${file}:`, error);
        return null;
      }
    })
  );
  
  const validDocs = docs.filter((d): d is { file: string; content: string } => d !== null);
  console.log('Successfully loaded docs:', validDocs.length);
  return validDocs;
}

// Improved heading extraction: handles ATX, Setext, ignores code blocks, trims/normalizes text
function extractHeadings(markdown: string, file: string) {
  const lines = markdown.split('\n');
  const headings = [];
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Toggle code block state
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    // ATX headings: #, ##, ###, ####
    const atx = line.match(/^(#{1,4})\s+(.*)/);
    if (atx) {
      const level = atx[1].length;
      const text = atx[2].trim().replace(/[`*_~]/g, '');
      const id = `${file.replace(/\W/g, '-')}-${text.replace(/\W/g, '-')}`;
      headings.push({ level, text, id, file });
      continue;
    }
    // Setext headings: underlined with === or ---
    if (i > 0 && /^\s*(=+|-{2,})\s*$/.test(line)) {
      const prev = lines[i - 1].trim();
      if (prev && !/^\s*```/.test(prev)) {
        const level = line[0] === '=' ? 1 : 2;
        const text = prev.replace(/[`*_~]/g, '');
        const id = `${file.replace(/\W/g, '-')}-${text.replace(/\W/g, '-')}`;
        headings.push({ level, text, id, file });
      }
    }
  }
  return headings;
}

function DocsTOC({ headings, onHeadingClick }: { headings: any[], onHeadingClick: (id: string) => void }) {
  return (
    <nav className="hidden xl:block fixed right-8 top-32 w-64 z-10">
      <div className="bg-docs-section border border-docs-section-border rounded-lg p-4">
        <div className="text-xs text-docs-muted font-bold mb-2 uppercase tracking-wider">On this page</div>
        <ul className="space-y-2">
          {headings.map(h => (
            <li key={h.id} style={{ marginLeft: (h.level - 1) * 8 }}>
              <button
                className="text-docs-muted hover:text-docs-accent text-xs transition text-left w-full truncate"
                onClick={() => onHeadingClick(h.id)}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default function Docs() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState<{ file: string; content: string }[]>([]);
  const [headings, setHeadings] = useState<any[]>([]);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchDocs().then((docs) => {
      setDocs(docs);
      const allHeadings = docs.flatMap((doc) => extractHeadings(doc.content, doc.file));
      setHeadings(allHeadings);
      console.log('Loaded docs:', docs);
      console.log('Extracted headings:', allHeadings);
    });
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = await fetch('/api/ask-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnswer(data.answer);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Failed to fetch answer.');
    } finally {
      setLoading(false);
    }
  }

  function handleTOCClick(id: string) {
    const el = contentRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderMarkdownWithAnchors(doc: { file: string; content: string }) {
    const components: Components = {
      h1: ({ children }) => {
        const text = String(children);
        const id = `${doc.file.replace(/\W/g, '-')}-${text.replace(/\W/g, '-')}`;
        return (
          <h1 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-2xl font-bold mt-8 mb-4 text-docs-text">
            {children}
          </h1>
        );
      },
      h2: ({ children }) => {
        const text = String(children);
        const id = `${doc.file.replace(/\W/g, '-')}-${text.replace(/\W/g, '-')}`;
        return (
          <h2 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-xl font-semibold mt-6 mb-3 text-docs-text">
            {children}
          </h2>
        );
      },
      h3: ({ children }) => {
        const text = String(children);
        const id = `${doc.file.replace(/\W/g, '-')}-${text.replace(/\W/g, '-')}`;
        return (
          <h3 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-lg font-semibold mt-4 mb-2 text-docs-text">
            {children}
          </h3>
        );
      },
      h4: ({ children }) => {
        const text = String(children);
        const id = `${doc.file.replace(/\W/g, '-')}-${text.replace(/\W/g, '-')}`;
        return (
          <h4 id={id} ref={el => { contentRefs.current[id] = el; }} className="text-base font-semibold mt-3 mb-2 text-docs-text">
            {children}
          </h4>
        );
      },
      p: ({ children }) => (
        <p className="text-sm text-docs-muted mb-4">{children}</p>
      ),
      code: ({ children, className }) => {
        const isInline = !className;
        return isInline ? 
          <code className="bg-docs-section px-1 py-0.5 rounded text-xs font-mono">{children}</code> :
          <pre className="bg-docs-section border border-docs-section-border rounded-lg p-4 font-mono text-xs text-docs-text overflow-x-auto my-4">
            {children}
          </pre>
      },
    };

    return (
      <ReactMarkdown
        key={doc.file}
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {doc.content}
      </ReactMarkdown>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex relative">
        <div className="flex-1 min-w-0 px-8">
          <h1 className="text-3xl font-bold mb-4 text-docs-text">DcisionAI</h1>
          <form onSubmit={handleSearch} className="mb-6 flex gap-2">
            <input
              type="text"
              className="flex-1 bg-docs-section border border-docs-section-border text-docs-text placeholder-docs-muted rounded px-3 py-2 text-sm"
              placeholder="Ask a question about DcisionAI..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-docs-accent text-white hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition"
              disabled={loading || !query.trim()}
            >
              {loading ? 'Searching...' : 'Ask'}
            </button>
          </form>
          
          {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
          
          {answer && (
            <div className="bg-docs-section border border-docs-section-border rounded-lg p-4 mb-8">
              <h2 className="text-lg font-semibold mb-2 text-docs-text">Answer</h2>
              <div className="text-sm text-docs-muted">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {answer}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Render all docs */}
          {docs.map(doc => renderMarkdownWithAnchors(doc))}
        </div>

        <div className="w-72 flex-shrink-0">
          <DocsTOC headings={headings} onHeadingClick={handleTOCClick} />
        </div>
      </div>
    </Layout>
  );
} 
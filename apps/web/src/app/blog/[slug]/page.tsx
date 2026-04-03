import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { getPostBySlug, getAllSlugs } from "../data";
import "@/styles/marketing.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | AdPilot Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://adpilot.au/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-xl font-semibold mt-8 mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p
          key={key++}
          className="font-semibold mt-4 mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith("**")) {
      const boldEnd = line.indexOf("**", 2);
      if (boldEnd !== -1) {
        elements.push(
          <p key={key++} className="mb-3" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>
              {line.slice(2, boldEnd)}
            </strong>
            {line.slice(boldEnd + 2)}
          </p>
        );
      } else {
        elements.push(
          <p key={key++} className="mb-3" style={{ color: "var(--text-secondary)" }}>
            {line}
          </p>
        );
      }
    } else if (line.startsWith("- **")) {
      const boldEnd = line.indexOf("**", 4);
      if (boldEnd !== -1) {
        elements.push(
          <li
            key={key++}
            className="ml-4 mb-2 list-disc"
            style={{ color: "var(--text-secondary)" }}
          >
            <strong style={{ color: "var(--text-primary)" }}>
              {line.slice(4, boldEnd)}
            </strong>
            {line.slice(boldEnd + 2)}
          </li>
        );
      }
    } else if (line.startsWith("- ")) {
      elements.push(
        <li
          key={key++}
          className="ml-4 mb-2 list-disc"
          style={{ color: "var(--text-secondary)" }}
        >
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      // skip empty lines
    } else {
      elements.push(
        <p key={key++} className="mb-3" style={{ color: "var(--text-secondary)" }}>
          {line}
        </p>
      );
    }
  }

  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <article className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium mb-8"
              style={{ color: "var(--accent-blue)" }}
            >
              &larr; Back to Blog
            </Link>

            <header className="mb-10">
              <h1
                className="marketing-h2 mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                {post.title}
              </h1>
              <div
                className="flex items-center gap-3 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>{post.author}</span>
                <span style={{ color: "var(--border-primary)" }}>|</span>
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span style={{ color: "var(--border-primary)" }}>|</span>
                <span>{post.readTime}</span>
              </div>
            </header>

            <div className="marketing-body leading-relaxed">
              {renderMarkdown(post.content)}
            </div>

            <div
              className="mt-16 pt-8"
              style={{ borderTop: "1px solid var(--border-primary)" }}
            >
              <div
                className="glass rounded-xl p-6 text-center"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Ready to transform your marketing?
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Join thousands of businesses using AdPilot to manage their
                  social media with AI.
                </p>
                <Link href="/signup" className="btn-cta">
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

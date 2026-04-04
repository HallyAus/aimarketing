import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { blogPosts } from "./data";
import "@/styles/marketing.css";

export const metadata: Metadata = {
  title: "Blog | ReachPilot",
  description:
    "Insights on AI-powered marketing, social media strategy, and building a global content workflow. From the ReachPilot team.",
  openGraph: {
    title: "Blog | ReachPilot",
    description:
      "Insights on AI-powered marketing, social media strategy, and building a global content workflow.",
    type: "website",
    url: "https://reachpilot.au/blog",
  },
};

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ background: "var(--bg-primary)" }}>
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="hero-glow" style={{ top: "-200px", left: "40%" }} />
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <p
                className="marketing-label mb-4"
                style={{ color: "var(--accent-blue)" }}
              >
                Blog
              </p>
              <h1
                className="marketing-h1 mb-6"
                style={{ color: "var(--text-primary)" }}
              >
                Insights &amp; Updates
              </h1>
              <p
                className="marketing-body max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Practical advice on AI marketing, multi-platform strategy, and
                building better content workflows.
              </p>
            </div>

            <div className="space-y-6">
              {blogPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="glass card-glow rounded-xl p-6 md:p-8 block"
                  style={{
                    borderColor: "var(--border-primary)",
                    textDecoration: "none",
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h2
                        className="text-xl font-semibold mb-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {post.title}
                      </h2>
                      <p
                        className="text-sm mb-3"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {post.description}
                      </p>
                      <div
                        className="flex items-center gap-3 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span>{post.author}</span>
                        <span style={{ color: "var(--border-primary)" }}>
                          |
                        </span>
                        <span>
                          {new Date(post.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span style={{ color: "var(--border-primary)" }}>
                          |
                        </span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <div
                      className="hidden md:flex items-center text-sm font-medium shrink-0"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      Read more &rarr;
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

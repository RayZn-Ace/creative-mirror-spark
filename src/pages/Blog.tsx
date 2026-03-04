import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  reading_time: string | null;
  published_at: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, category, reading_time, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <PageLayout title="Blog & News" subtitle="Tipps, Stories und Insider-Wissen rund um unsere Events und Party-Tour.">
      {loading ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Noch keine Blog-Beiträge vorhanden.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block rounded-2xl p-5 sm:p-6 transition-all hover:scale-[1.01]"
              style={{
                background: "hsl(220 40% 13%)",
                border: "1px solid hsl(0 0% 100% / 0.08)",
              }}
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {post.category && (
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "hsl(220 60% 25%)", color: "hsl(210 80% 65%)" }}
                  >
                    {post.category}
                  </span>
                )}
                {post.published_at && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                {post.reading_time && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    <Clock className="w-3 h-3" />
                    {post.reading_time}
                  </span>
                )}
              </div>
              <h2
                className="text-base sm:text-lg font-black uppercase tracking-wide mb-2"
                style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
              >
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-sm mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  {post.excerpt}
                </p>
              )}
              <span
                className="inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "hsl(330 80% 55%)" }}
              >
                Weiterlesen <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default Blog;

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  reading_time: string | null;
  published_at: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      setPost(data as BlogPost | null);
      setLoading(false);
    };
    load();
  }, [slug]);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <PageLayout title="Blog" subtitle="">
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout title="Nicht gefunden" subtitle="">
        <div className="text-center py-16">
          <p className="text-sm mb-4" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Dieser Beitrag existiert nicht.</p>
          <Link to="/blog" className="text-sm font-semibold" style={{ color: "hsl(330 80% 55%)" }}>
            ← Zurück zum Blog
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={post.title} subtitle="">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
          style={{ color: "hsl(330 80% 55%)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Blog
        </Link>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
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

        <div
          className="prose prose-invert max-w-none text-sm leading-relaxed"
          style={{ color: "hsl(0 0% 100% / 0.7)" }}
        >
          {post.content?.split("\n").map((p, i) => (
            <p key={i} className="mb-4">{p}</p>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default BlogPost;

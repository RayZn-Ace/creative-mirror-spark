import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Image, Upload, Eye, EyeOff, Calendar, MapPin, Video, Star, Link } from "lucide-react";

type Album = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  location: string | null;
  photo_count: number;
  status: string;
  sort_order: number | null;
  created_at: string;
};

type MediaItem = {
  id: string;
  album_id: string;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  sort_order: number | null;
  created_at: string;
  media_type: string;
  video_url: string | null;
};

const MediaAdmin = () => {
  const queryClient = useQueryClient();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: "", description: "", event_date: "", location: "" });
  const [newVideo, setNewVideo] = useState({ url: "", caption: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "photo" | "video">("all");

  // Fetch albums
  const { data: albums = [], isLoading } = useQuery({
    queryKey: ["admin-media-albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_albums")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Album[];
    },
  });

  // Fetch media items for selected album
  const { data: mediaItems = [] } = useQuery({
    queryKey: ["admin-media-photos", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return [];
      const { data, error } = await supabase
        .from("media_photos")
        .select("*")
        .eq("album_id", selectedAlbum.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
    enabled: !!selectedAlbum,
  });

  const filteredMedia = mediaItems.filter((m) => {
    if (mediaFilter === "all") return true;
    return (m.media_type || "photo") === mediaFilter;
  });

  const photoCount = mediaItems.filter((m) => (m.media_type || "photo") === "photo").length;
  const videoCount = mediaItems.filter((m) => m.media_type === "video").length;

  // Create album
  const createAlbumMutation = useMutation({
    mutationFn: async () => {
      const slug = newAlbum.title
        .toLowerCase()
        .replace(/[^a-z0-9äöüß\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
      const { error } = await supabase.from("media_albums").insert({
        title: newAlbum.title,
        slug,
        description: newAlbum.description || null,
        event_date: newAlbum.event_date || null,
        location: newAlbum.location || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      setCreateOpen(false);
      setNewAlbum({ title: "", description: "", event_date: "", location: "" });
      toast.success("Album erstellt");
    },
    onError: () => toast.error("Fehler beim Erstellen"),
  });

  // Delete album
  const deleteAlbumMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete all photos from storage first
      const { data: photos } = await supabase.from("media_photos").select("image_url").eq("album_id", id);
      if (photos) {
        const paths = photos.map((p) => {
          try {
            const url = new URL(p.image_url);
            const match = url.pathname.match(/media-photos\/(.+)/);
            return match ? match[1] : null;
          } catch { return null; }
        }).filter(Boolean) as string[];
        if (paths.length > 0) await supabase.storage.from("media-photos").remove(paths);
      }
      await supabase.from("media_photos").delete().eq("album_id", id);
      const { error } = await supabase.from("media_albums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      setSelectedAlbum(null);
      toast.success("Album gelöscht");
    },
  });

  // Toggle album status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "published" ? "draft" : "published";
      const { error } = await supabase.from("media_albums").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      toast.success("Status geändert");
    },
  });

  // Upload photos
  const handleUpload = useCallback(async (files: FileList) => {
    if (!selectedAlbum) return;
    setUploading(true);
    try {
      const currentCount = mediaItems.length;
      let firstUrl = "";
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const path = `${selectedAlbum.id}/${Date.now()}-${i}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("media-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("media-photos").getPublicUrl(path);
        if (i === 0) firstUrl = urlData.publicUrl;

        await supabase.from("media_photos").insert({
          album_id: selectedAlbum.id,
          image_url: urlData.publicUrl,
          sort_order: currentCount + i,
          media_type: "photo",
        });
      }

      // Update photo count & set cover if none
      const updates: Record<string, unknown> = { photo_count: currentCount + files.length };
      if (!selectedAlbum.cover_image_url && firstUrl) {
        updates.cover_image_url = firstUrl;
      }
      await supabase.from("media_albums").update(updates).eq("id", selectedAlbum.id);

      queryClient.invalidateQueries({ queryKey: ["admin-media-photos", selectedAlbum.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      toast.success(`${files.length} Foto(s) hochgeladen`);
    } catch (e) {
      toast.error("Fehler beim Hochladen");
      console.error(e);
    } finally {
      setUploading(false);
    }
  }, [selectedAlbum, mediaItems.length, queryClient]);

  // Add video (YouTube/external URL)
  const addVideoMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAlbum) throw new Error("Kein Album");
      const videoUrl = newVideo.url.trim();
      // Extract YouTube thumbnail
      let thumbnail = "";
      const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }

      await supabase.from("media_photos").insert({
        album_id: selectedAlbum.id,
        image_url: thumbnail || "/placeholder.svg",
        thumbnail_url: thumbnail || null,
        video_url: videoUrl,
        media_type: "video",
        caption: newVideo.caption || null,
        sort_order: mediaItems.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-photos", selectedAlbum?.id] });
      setAddVideoOpen(false);
      setNewVideo({ url: "", caption: "" });
      toast.success("Video hinzugefügt");
    },
    onError: () => toast.error("Fehler beim Hinzufügen"),
  });

  // Set cover image
  const setCoverMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!selectedAlbum) return;
      const { error } = await supabase.from("media_albums").update({ cover_image_url: imageUrl }).eq("id", selectedAlbum.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      toast.success("Cover-Bild gesetzt");
    },
  });

  // Upload cover image directly
  const handleCoverUpload = useCallback(async (file: File, albumId: string) => {
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${albumId}/cover-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("media-photos").getPublicUrl(path);
      const { error } = await supabase.from("media_albums").update({ cover_image_url: urlData.publicUrl }).eq("id", albumId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      if (selectedAlbum && selectedAlbum.id === albumId) {
        setSelectedAlbum({ ...selectedAlbum, cover_image_url: urlData.publicUrl });
      }
      toast.success("Titelbild gesetzt");
    } catch (e) {
      toast.error("Fehler beim Hochladen des Titelbilds");
      console.error(e);
    } finally {
      setUploadingCover(false);
    }
  }, [queryClient, selectedAlbum]);

  // Delete media item
  const deleteMediaMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      if ((item.media_type || "photo") === "photo") {
        try {
          const url = new URL(item.image_url);
          const pathMatch = url.pathname.match(/media-photos\/(.+)/);
          if (pathMatch) await supabase.storage.from("media-photos").remove([pathMatch[1]]);
        } catch {}
      }
      const { error } = await supabase.from("media_photos").delete().eq("id", item.id);
      if (error) throw error;
      if (selectedAlbum) {
        const newCount = Math.max(0, mediaItems.length - 1);
        await supabase.from("media_albums").update({ photo_count: newCount }).eq("id", selectedAlbum.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-photos", selectedAlbum?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      toast.success("Gelöscht");
    },
  });

  // Extract YouTube ID
  const getYoutubeId = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  // ── Album detail view ──
  if (selectedAlbum) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedAlbum(null)}>← Zurück</Button>
            <h2 className="text-xl font-bold">{selectedAlbum.title}</h2>
            <Badge variant={selectedAlbum.status === "published" ? "default" : "secondary"}>
              {selectedAlbum.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Cover image upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0], selectedAlbum.id)}
              />
              <Button asChild variant="outline" disabled={uploadingCover} size="sm">
                <span><Star className="w-4 h-4 mr-1" />{uploadingCover ? "Lädt..." : "Titelbild ändern"}</span>
              </Button>
            </label>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
              <Button asChild disabled={uploading} size="sm">
                <span><Upload className="w-4 h-4 mr-1" />{uploading ? "Lädt..." : "Fotos hochladen"}</span>
              </Button>
            </label>
            <Dialog open={addVideoOpen} onOpenChange={setAddVideoOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Video className="w-4 h-4 mr-1" />Video hinzufügen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Video hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>YouTube / Video-URL *</Label>
                    <Input
                      value={newVideo.url}
                      onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">YouTube-Links werden automatisch mit Thumbnail dargestellt</p>
                  </div>
                  <div>
                    <Label>Beschreibung (optional)</Label>
                    <Input
                      value={newVideo.caption}
                      onChange={(e) => setNewVideo({ ...newVideo, caption: e.target.value })}
                      placeholder="z.B. Aftermovie Mamma Mia Köln"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addVideoMutation.mutate()}
                    disabled={!newVideo.url.trim() || addVideoMutation.isPending}
                  >
                    Video hinzufügen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {(["all", "photo", "video"] as const).map((f) => (
            <Button
              key={f}
              variant={mediaFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setMediaFilter(f)}
              className="text-xs"
            >
              {f === "all" ? `Alle (${mediaItems.length})` : f === "photo" ? `Fotos (${photoCount})` : `Videos (${videoCount})`}
            </Button>
          ))}
        </div>

        {filteredMedia.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Image className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Noch keine Medien</p>
              <p className="text-sm">Lade Fotos hoch oder füge Videos hinzu.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredMedia.map((item) => {
              const isVideo = item.media_type === "video";
              const isCover = selectedAlbum.cover_image_url === item.image_url;
              return (
                <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt={item.caption || ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isVideo && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1">
                        <Video className="w-3 h-3" /> Video
                      </Badge>
                    </div>
                  )}
                  {isCover && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] px-1.5 py-0.5 gap-1 bg-yellow-500 text-black">
                        <Star className="w-3 h-3" /> Cover
                      </Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!isVideo && !isCover && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        title="Als Cover setzen"
                        onClick={() => setCoverMutation.mutate(item.image_url)}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteMediaMutation.mutate(item)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-white text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.caption}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Album list view ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Medien</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Neues Album</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Album erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titel *</Label>
                <Input
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  placeholder="z.B. 31.01.2025 | Finn's Penthouse Mainz"
                />
              </div>
              <div>
                <Label>Event-Datum</Label>
                <Input
                  type="date"
                  value={newAlbum.event_date}
                  onChange={(e) => setNewAlbum({ ...newAlbum, event_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={newAlbum.location}
                  onChange={(e) => setNewAlbum({ ...newAlbum, location: e.target.value })}
                  placeholder="z.B. Finn's Penthouse Eventlocation Mainz"
                />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createAlbumMutation.mutate()}
                disabled={!newAlbum.title || createAlbumMutation.isPending}
              >
                Album erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden...</div>
      ) : albums.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Image className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Noch keine Alben</p>
            <p className="text-sm">Erstelle dein erstes Foto-Album.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <Card
              key={album.id}
              className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
              onClick={() => setSelectedAlbum(album)}
            >
              <div className="aspect-video bg-muted relative">
                {album.cover_image_url ? (
                  <img src={album.cover_image_url} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                <Badge
                  className="absolute top-2 right-2"
                  variant={album.status === "published" ? "default" : "secondary"}
                >
                  {album.status === "published" ? "Öffentlich" : "Entwurf"}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-1">{album.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {album.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(album.event_date).toLocaleDateString("de-DE")}
                    </span>
                  )}
                  {album.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {album.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    {album.photo_count}
                  </span>
                </div>
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0], album.id)}
                    />
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <span><Star className="w-3 h-3 mr-1" />Titelbild</span>
                    </Button>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleStatusMutation.mutate({ id: album.id, status: album.status })}
                  >
                    {album.status === "published" ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {album.status === "published" ? "Verbergen" : "Veröffentlichen"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (confirm("Album wirklich löschen? Alle Fotos und Videos werden gelöscht.")) deleteAlbumMutation.mutate(album.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaAdmin;

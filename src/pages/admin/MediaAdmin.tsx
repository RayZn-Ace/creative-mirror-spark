import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Image, Upload, Eye, EyeOff, GripVertical, X, Calendar, MapPin } from "lucide-react";

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

type Photo = {
  id: string;
  album_id: string;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  sort_order: number | null;
  created_at: string;
};

const MediaAdmin = () => {
  const queryClient = useQueryClient();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: "", description: "", event_date: "", location: "" });
  const [uploading, setUploading] = useState(false);

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

  // Fetch photos for selected album
  const { data: photos = [] } = useQuery({
    queryKey: ["admin-media-photos", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return [];
      const { data, error } = await supabase
        .from("media_photos")
        .select("*")
        .eq("album_id", selectedAlbum.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Photo[];
    },
    enabled: !!selectedAlbum,
  });

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
      const currentCount = photos.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const path = `${selectedAlbum.id}/${Date.now()}-${i}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("media-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("media-photos").getPublicUrl(path);

        const { error: insertError } = await supabase.from("media_photos").insert({
          album_id: selectedAlbum.id,
          image_url: urlData.publicUrl,
          sort_order: currentCount + i,
        });
        if (insertError) throw insertError;
      }

      // Update photo count
      await supabase.from("media_albums").update({ 
        photo_count: currentCount + files.length,
        cover_image_url: selectedAlbum.cover_image_url || supabase.storage.from("media-photos").getPublicUrl(`${selectedAlbum.id}/${Date.now()}-0.${files[0].name.split(".").pop()}`).data.publicUrl
      }).eq("id", selectedAlbum.id);

      queryClient.invalidateQueries({ queryKey: ["admin-media-photos", selectedAlbum.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      toast.success(`${files.length} Foto(s) hochgeladen`);
    } catch (e) {
      toast.error("Fehler beim Hochladen");
      console.error(e);
    } finally {
      setUploading(false);
    }
  }, [selectedAlbum, photos.length, queryClient]);

  // Delete photo
  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: Photo) => {
      // Extract path from URL
      const url = new URL(photo.image_url);
      const pathMatch = url.pathname.match(/media-photos\/(.+)/);
      if (pathMatch) {
        await supabase.storage.from("media-photos").remove([pathMatch[1]]);
      }
      const { error } = await supabase.from("media_photos").delete().eq("id", photo.id);
      if (error) throw error;
      // Update count
      if (selectedAlbum) {
        await supabase.from("media_albums").update({ photo_count: Math.max(0, (selectedAlbum.photo_count || 0) - 1) }).eq("id", selectedAlbum.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-photos", selectedAlbum?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-media-albums"] });
      toast.success("Foto gelöscht");
    },
  });

  // Album detail view
  if (selectedAlbum) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedAlbum(null)}>← Zurück</Button>
            <h2 className="text-xl font-bold">{selectedAlbum.title}</h2>
            <Badge variant={selectedAlbum.status === "published" ? "default" : "secondary"}>
              {selectedAlbum.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
              <Button asChild disabled={uploading}>
                <span><Upload className="w-4 h-4 mr-2" />{uploading ? "Lädt..." : "Fotos hochladen"}</span>
              </Button>
            </label>
          </div>
        </div>

        {photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Image className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Noch keine Fotos</p>
              <p className="text-sm">Lade Fotos hoch, um dieses Album zu füllen.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                <img src={photo.image_url} alt={photo.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deletePhotoMutation.mutate(photo)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Album list view
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
                    {album.photo_count} Fotos
                  </span>
                </div>
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
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
                      if (confirm("Album wirklich löschen?")) deleteAlbumMutation.mutate(album.id);
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

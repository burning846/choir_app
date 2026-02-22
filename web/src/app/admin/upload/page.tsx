"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [backingFile, setBackingFile] = useState<File | null>(null);
  const [vocalFile, setVocalFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first");
      return;
    }
    if (!title || !pdfFile || !backingFile) {
      alert("Please fill in title, PDF, and backing track");
      return;
    }

    setUploading(true);
    setStatus("Starting upload...");

    try {
      // 1. Upload Files
      const timestamp = Date.now();
      
      // Upload PDF
      setStatus("Uploading PDF...");
      const pdfPath = `songs/${timestamp}-${pdfFile.name}`;
      const { error: pdfError } = await supabase.storage
        .from('sheet-music')
        .upload(pdfPath, pdfFile);
      if (pdfError) throw pdfError;
      const { data: { publicUrl: pdfUrl } } = supabase.storage.from('sheet-music').getPublicUrl(pdfPath);

      // Upload Backing
      setStatus("Uploading Backing Track...");
      const backingPath = `stems/${timestamp}-backing-${backingFile.name}`;
      const { error: backingError } = await supabase.storage
        .from('audio-stems')
        .upload(backingPath, backingFile);
      if (backingError) throw backingError;
      const { data: { publicUrl: backingUrl } } = supabase.storage.from('audio-stems').getPublicUrl(backingPath);

      // Upload Vocal (Optional)
      let vocalUrl = null;
      if (vocalFile) {
        setStatus("Uploading Vocal Guide...");
        const vocalPath = `stems/${timestamp}-vocal-${vocalFile.name}`;
        const { error: vocalError } = await supabase.storage
          .from('audio-stems')
          .upload(vocalPath, vocalFile);
        if (vocalError) throw vocalError;
        const { data: { publicUrl: vUrl } } = supabase.storage.from('audio-stems').getPublicUrl(vocalPath);
        vocalUrl = vUrl;
      }

      // 2. Create Song Record
      setStatus("Creating Database Records...");
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .insert({
          title,
          composer,
          pdf_url: pdfUrl,
          created_by: user.id
        })
        .select()
        .single();

      if (songError) throw songError;

      // 3. Create Stem Records
      const stemsToInsert = [
        {
          song_id: songData.id,
          name: "Accompaniment",
          type: "backing",
          file_url: backingUrl
        }
      ];

      if (vocalUrl) {
        stemsToInsert.push({
          song_id: songData.id,
          name: "Vocal Guide",
          type: "vocal",
          file_url: vocalUrl
        });
      }

      const { error: stemsError } = await supabase
        .from('stems')
        .insert(stemsToInsert);

      if (stemsError) throw stemsError;

      setStatus("Upload Complete!");
      alert("Song uploaded successfully!");
      router.push("/library");

    } catch (error: any) {
      console.error("Upload failed:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/library">← Back to Library</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Song</CardTitle>
          <CardDescription>Add a new piece to the choir library</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="title">Song Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Hallelujah Chorus"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="composer">Composer</Label>
              <Input 
                id="composer" 
                value={composer} 
                onChange={e => setComposer(e.target.value)} 
                placeholder="e.g. Handel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf">Sheet Music (PDF)</Label>
              <Input 
                id="pdf" 
                type="file" 
                accept="application/pdf"
                onChange={e => setPdfFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backing">Accompaniment Audio (MP3/WAV)</Label>
              <Input 
                id="backing" 
                type="file" 
                accept="audio/*"
                onChange={e => setBackingFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vocal">Vocal Guide Audio (Optional)</Label>
              <Input 
                id="vocal" 
                type="file" 
                accept="audio/*"
                onChange={e => setVocalFile(e.target.files?.[0] || null)}
              />
            </div>

            {status && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                Status: {status}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Song"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Song {
  id: string;
  title: string;
  composer: string;
  parts?: string[]; // Optional for now
}

export default function LibraryPage() {
  const { user, signOut } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSongs(data);
        } else {
          // Fallback to mock data if DB is empty
          setSongs([
            { id: "1", title: "Yellow River Cantata", composer: "Xian Xinghai", parts: ["Soprano", "Alto", "Tenor", "Bass"] },
            { id: "2", title: "Ode to Joy", composer: "Beethoven", parts: ["SATB"] },
            { id: "3", title: "Ave Verum Corpus", composer: "Mozart", parts: ["Soprano", "Alto", "Tenor", "Bass"] },
          ]);
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  return (
    <div className="container mx-auto p-4 py-8 max-w-4xl">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Music Library</h1>
          {user && <p className="text-muted-foreground mt-1">Welcome, {user.email}</p>}
        </div>
        <div className="flex gap-2">
           {!user ? (
             <Button asChild>
               <Link href="/login">Login</Link>
             </Button>
           ) : (
             <Button variant="ghost" onClick={() => signOut()}>
               Logout
             </Button>
           )}
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12">Loading library...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <Card key={song.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{song.title}</CardTitle>
                <CardDescription>{song.composer}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {song.parts ? `Parts: ${song.parts.join(", ")}` : "Parts: SATB"}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/practice/${song.id}`}>Practice</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

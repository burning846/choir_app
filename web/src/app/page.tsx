import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <main className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">Choir Practice</h1>
        <p className="text-muted-foreground text-lg">
          Your personal space for mastering choir pieces.
          Practice anytime, anywhere.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row justify-center pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/library">View Library (Demo)</Link>
          </Button>
        </div>
      </main>
      
      <footer className="absolute bottom-4 text-sm text-muted-foreground">
        © 2024 Choir Practice App
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-8 text-center max-w-md">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-slate-600 mb-6">
          Die angeforderte Seite konnte nicht gefunden werden.
        </p>
        <Link href="/">
          <Button>Zurück zum Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}


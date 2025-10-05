import { Dna, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent shadow-medium">
            <Dna className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text">
                OmniAlign Atlas
              </h1>
              <Badge variant="secondary" className="flex items-center gap-1 uppercase tracking-[0.25em] text-[10px]">
                <Sparkles className="w-3 h-3" />
                v2
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Unified nucleotide and protein alignment studio - streamlined FASTA parsing, smart mutation analytics, BLAST shortcuts, and instant PyMOL commands in a single, deploy-ready experience.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

import { Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Atom, Dna, Github } from "lucide-react";
import type { SequenceType } from "@/lib/sequenceUtils";

interface ExperienceSpotlightProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeSelect: (mode: SequenceType) => void;
  activeMode: SequenceType;
}

const featureBullets = [
  "Context-aware FASTA parsing with smart validation",
  "Inline mutation analytics with transition/transversion detection",
  "Direct BLAST launchers and ready-to-copy PyMOL macros",
];

export const ExperienceSpotlight = ({
  open,
  onOpenChange,
  onModeSelect,
  activeMode,
}: ExperienceSpotlightProps) => {
  const handleModeClick = (mode: SequenceType) => {
    onModeSelect(mode);
    onOpenChange(false);
  };

  return (
    <Fragment>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl border-primary/40 bg-card/95 backdrop-blur-xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <Sparkles className="w-4 h-4 text-accent" />
              Welcome Tour
            </div>
            <DialogTitle className="text-2xl font-bold">
              OmniAlign Atlas
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Dual-mode playground for protein and nucleotide intelligence. Pick your mode and dive straight into tailored analytics.
            </DialogDescription>
            <Badge variant="secondary" className="self-start text-[10px] uppercase tracking-[0.25em]">
              Deploy-ready
            </Badge>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2 text-sm text-muted-foreground">
              {featureBullets.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Separator className="border-border/60" />

            <div className="grid gap-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                Choose your starting mode
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  variant={activeMode === "protein" ? "default" : "outline"}
                  className="justify-start gap-3 h-auto py-4"
                  onClick={() => handleModeClick("protein")}
                >
                  <Atom className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Protein mode</div>
                    <div className="text-xs text-muted-foreground">
                      Hydrophobicity, pI, and PyMOL-ready mutation macros
                    </div>
                  </div>
                </Button>
                <Button
                  variant={activeMode === "nucleotide" ? "default" : "outline"}
                  className="justify-start gap-3 h-auto py-4"
                  onClick={() => handleModeClick("nucleotide")}
                >
                  <Dna className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Nucleotide mode</div>
                    <div className="text-xs text-muted-foreground">
                      GC balance, Ti/Tv ratios, and one-click BLAST launches
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-border/60 rounded-lg p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                Deploy with a single `npm run build` - perfect for GitHub Pages.
              </div>
              <Button size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
                Let&apos;s build
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-40 shadow-large gap-2"
        onClick={() => onOpenChange(true)}
      >
        <Sparkles className="w-4 h-4" />
        Experience tour
      </Button>
    </Fragment>
  );
};

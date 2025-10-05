import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { inferSequenceType, type SequenceType } from "@/lib/sequenceUtils";
import { Download, Info, Rocket, Workflow } from "lucide-react";

interface ToolSidebarProps {
  sequences: Array<{ header: string; sequence: string }>;
  sequenceType: SequenceType;
}

type BlastTarget = "ncbi" | "local";

export const ToolSidebar = ({ sequences, sequenceType }: ToolSidebarProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [blastTarget, setBlastTarget] = useState<BlastTarget>("ncbi");

  useEffect(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return sequences.length > 0 ? 0 : null;
      if (prev >= sequences.length) return sequences.length > 0 ? sequences.length - 1 : null;
      return prev;
    });
  }, [sequences.length]);

  const selectableSequences = useMemo(
    () =>
      sequences.map((seq, idx) => ({
        value: idx.toString(),
        label: seq.header || `Sequence ${idx + 1}`,
      })),
    [sequences],
  );

  const selectedSequence = selectedIndex !== null ? sequences[selectedIndex] : null;
  const resolvedType = selectedSequence ? inferSequenceType(selectedSequence.sequence) : sequenceType;
  const program = resolvedType === "protein" ? "blastp" : "blastn";
  const database = resolvedType === "protein" ? "nr" : "nt";

  const fastaPayload = selectedSequence
    ? `>${selectedSequence.header}\n${selectedSequence.sequence}\n`
    : "";

  const handleBlast = () => {
    if (!selectedSequence) {
      toast.error("Select a sequence to run BLAST");
      return;
    }

    if (blastTarget === "ncbi") {
      try {
        const form = document.createElement("form");
        form.method = "post";
        form.target = "_blank";
        form.action = "https://blast.ncbi.nlm.nih.gov/Blast.cgi";

        const params: Record<string, string> = {
          CMD: "Put",
          PROGRAM: program,
          DATABASE: database,
          QUERY: fastaPayload,
        };

        Object.entries(params).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        toast.success(`Submitting ${selectedSequence.header} to NCBI ${program.toUpperCase()}`);
      } catch (error) {
        console.error(error);
        toast.error("Unable to launch NCBI BLAST. Check your popup settings.");
      }
      return;
    }

    if (!navigator.clipboard) {
      toast.error("Clipboard access denied. Copy the FASTA manually to run local BLAST.");
      return;
    }

    navigator.clipboard
      .writeText(fastaPayload)
      .then(() => {
        toast.success(
          `${selectedSequence.header} copied. Run \`${program} -query sequence.fasta -db ${database}\` with BLAST+`,
        );
      })
      .catch(() => {
        toast.error("Could not copy sequence for local BLAST. Try copying manually.");
      });
  };

  const handleDownload = () => {
    if (!selectedSequence) {
      toast.error("Select a sequence to download");
      return;
    }

    const blob = new Blob([fastaPayload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedSequence.header || "sequence"}.fasta`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded FASTA for ${selectedSequence.header}`);
  };

  return (
    <aside className="w-full space-y-4 lg:max-w-xs">
      <Card className="p-5 shadow-soft border-border/60 bg-card/80 space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Alignment utilities
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick any parsed sequence and launch BLAST through NCBI or prep a local BLAST+ run. You can also
            download the FASTA snippet for manual workflows.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="sidebar-sequence-select" className="text-sm font-medium">
              Sequence to analyze
            </Label>
            <Select
              value={selectedIndex !== null ? selectedIndex.toString() : undefined}
              onValueChange={(next) => setSelectedIndex(parseInt(next, 10))}
              disabled={selectableSequences.length === 0}
            >
              <SelectTrigger id="sidebar-sequence-select">
                <SelectValue placeholder={selectableSequences.length === 0 ? "No sequences yet" : "Choose a sequence"} />
              </SelectTrigger>
              <SelectContent>
                {selectableSequences.map((sequence) => (
                  <SelectItem key={sequence.value} value={sequence.value}>
                    {sequence.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sidebar-target-select" className="text-sm font-medium">
              BLAST destination
            </Label>
            <Select value={blastTarget} onValueChange={(next) => setBlastTarget(next as BlastTarget)}>
              <SelectTrigger id="sidebar-target-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ncbi">NCBI Web BLAST ({program.toUpperCase()})</SelectItem>
                <SelectItem value="local">Local BLAST+ ({program} CLI)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleBlast}
            disabled={!selectedSequence}
            className="inline-flex items-center gap-2"
          >
            <Rocket className="h-4 w-4" />
            Blast sequence
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            disabled={!selectedSequence}
            className="inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download FASTA
          </Button>
          {selectedSequence && (
            <p className="text-xs leading-relaxed text-muted-foreground flex items-start gap-2">
              <Workflow className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Destination database: <span className="font-medium uppercase">{database}</span>. Tip: local BLAST copies the
                FASTA to your clipboard for quick shell commands.
              </span>
            </p>
          )}
          {!selectedSequence && (
            <p className="text-xs leading-relaxed text-muted-foreground flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Provide sequences above to unlock BLAST utilities.</span>
            </p>
          )}
        </div>
      </Card>
    </aside>
  );
};

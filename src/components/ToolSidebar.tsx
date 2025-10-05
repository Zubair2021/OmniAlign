import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Cpu, Microscope, Github, Dna, TestTube } from "lucide-react";

const toolLinks = [
  {
    name: "AlphaFold Protein Structure",
    href: "https://alphafold.ebi.ac.uk/",
    icon: Cpu,
    description: "Explore high-confidence protein structure predictions from DeepMind.",
  },
  {
    name: "ESMFold API",
    href: "https://esmatlas.com/resources?action=fold",
    icon: Microscope,
    description: "Metagenomic-scale folding via Meta AI's language model for proteins.",
  },
  {
    name: "NVIDIA BioNeMo",
    href: "https://developer.nvidia.com/bionemo",
    icon: Cpu,
    description: "Run diffusion and transformer models for biomolecular design in the cloud.",
  },
  {
    name: "NCBI BLASTp",
    href: "https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE=Proteins",
    icon: TestTube,
    description: "Search protein databases for homologs (amino acid sequences).",
  },
  {
    name: "NCBI BLASTn",
    href: "https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE=Nucleotides",
    icon: Dna,
    description: "Align nucleotide sequences against the NCBI collection.",
  },
  {
    name: "GitHub PyMOL Scripts",
    href: "https://github.com/schrodinger/pymol-open-source",
    icon: Github,
    description: "Open-source PyMOL repository for advanced scripting examples.",
  },
];

export const ToolSidebar = () => (
  <aside className="w-full space-y-4 lg:max-w-xs">
    <Card className="p-5 shadow-soft border-border/60 bg-card/80">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Research Portals
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Quick launches into structure prediction, homology search, and visualization ecosystems.
      </p>
    </Card>

    {toolLinks.map((tool) => (
      <Card key={tool.name} className="p-4 shadow-soft border-border/60 bg-card/80 hover:shadow-medium transition-shadow">
        <div className="flex items-start gap-3">
          <tool.icon className="mt-1 h-4 w-4 text-primary" />
          <div className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold leading-tight">{tool.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="px-0 text-primary hover:text-primary">
              <a href={tool.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                Visit resource
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    ))}
  </aside>
);

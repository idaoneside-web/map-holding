import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Grid } from "@/components/layout/Grid";
import { Reveal } from "@/components/motion/Reveal";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { portalProjects } from "@/content/portal";

export const metadata: Metadata = {
  title: "My Projects",
  description: "Projects you are a party to in the MAP Holding client environment.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/projects — the client's portfolio.
 */
export default function PortalProjectsPage() {
  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="My Projects"
          title="Your projects"
          lead="Each project below shows only the information released to you, with its own status and any related application."
        />

        <Grid min="22rem" gap="lg">
          {portalProjects.map((project, index) => (
            <Reveal key={project.id} delay={index * 80}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

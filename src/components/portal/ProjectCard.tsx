"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/controls/Button";
import { Badge } from "@/components/feedback/Badge";
import { StatusBadge, type StatusTone } from "@/components/feedback/StatusBadge";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Heading, Text } from "@/components/typography/Text";
import type { PortalProject, ProjectStatus } from "@/content/portal";
import styles from "./ProjectCard.module.css";

export interface ProjectCardProps {
  project: PortalProject;
  className?: string;
  onOpen?: () => void;
}

const STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  active: "success",
  "in-review": "warning",
  pipeline: "info",
  complete: "neutral",
};

/**
 * ProjectCard — one project in the client's portfolio.
 */
export function ProjectCard({ project, className, onOpen }: ProjectCardProps) {
  const router = useRouter();

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    } else {
      router.push(`/client-portal/projects/${project.id}`);
    }
  };

  return (
    <article className={cn(styles.card, className)}>
      <div className={styles.visual}>
        <ImageSlot label={project.imageLabel} ratio="16/9" className={styles.slot} />
        <span className={styles.ref}>{project.ref}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.head}>
          <Heading level={3} className={styles.name}>
            {project.name}
          </Heading>
          <StatusBadge tone={STATUS_TONE[project.status]}>{project.statusLabel}</StatusBadge>
        </div>

        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>Sector</dt>
            <dd className={styles.metaValue}>{project.sector}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>Location</dt>
            <dd className={styles.metaValue}>{project.location}</dd>
          </div>
          {project.applicationRef ? (
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>Application</dt>
              <dd className={styles.metaValue}>{project.applicationRef}</dd>
            </div>
          ) : null}
        </dl>

        <Text variant="body-s" tone="default" className={styles.description}>
          {project.description}
        </Text>

        <div className={styles.foot}>
          <Button variant="outline" size="sm" onClick={handleOpen}>
            View details
          </Button>
          {project.isSample ? <Badge tone="gold">Sample record</Badge> : null}
        </div>
      </div>
    </article>
  );
}

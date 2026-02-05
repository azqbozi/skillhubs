import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstallButton } from './InstallButton';
import type { RegistrySkill } from '@/data/registry';
import { Star } from 'lucide-react';

interface SkillCardProps {
  skill: RegistrySkill;
  isInstalled?: boolean;
}

/**
 * Skill 展示卡片组件
 */
export function SkillCard({ skill, isInstalled = false }: SkillCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{skill.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {skill.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{skill.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span>{skill.stars.toLocaleString()}</span>
          <span>·</span>
          <span>{skill.author}</span>
        </div>
      </CardContent>
      <CardFooter>
        <InstallButton skill={skill} isInstalled={isInstalled} />
      </CardFooter>
    </Card>
  );
}

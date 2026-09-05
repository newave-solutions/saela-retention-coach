import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, ListTodo } from "lucide-react";
import { toast } from "sonner";

import {
  createLinearFollowUps,
  listLinearTeams,
  listTeamsChannels,
  postSessionToTeams,
} from "@/lib/integrations.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function errorText(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 220 ? `${message.slice(0, 220)}…` : message;
}

export function ShareSessionPanel({ sessionId }: { sessionId: string }) {
  const fetchChannels = useServerFn(listTeamsChannels);
  const fetchLinearTeams = useServerFn(listLinearTeams);
  const postToTeams = useServerFn(postSessionToTeams);
  const createIssues = useServerFn(createLinearFollowUps);

  const [channelValue, setChannelValue] = useState<string>("");
  const [linearTeamId, setLinearTeamId] = useState<string>("");

  const channels = useQuery({
    queryKey: ["teams-channels"],
    queryFn: async () => (await fetchChannels()).items ?? [],
    retry: false,
  });

  const linearTeams = useQuery({
    queryKey: ["linear-teams"],
    queryFn: async () => (await fetchLinearTeams()).items ?? [],
    retry: false,
  });

  const post = useMutation({
    mutationFn: async () => {
      const [teamId, channelId] = channelValue.split("|");
      return postToTeams({ data: { sessionId, teamId: teamId!, channelId: channelId! } });
    },
    onSuccess: () => toast.success("Debrief posted to your coaching channel."),
    onError: (error) => toast.error(errorText(error)),
  });

  const issues = useMutation({
    mutationFn: async () => createIssues({ data: { sessionId, teamId: linearTeamId } }),
    onSuccess: (result) =>
      toast.success(`Created ${result.created.length} follow-up task(s) in Linear.`),
    onError: (error) => toast.error(errorText(error)),
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <h2 className="text-base font-semibold leading-none">Share this call</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send the debrief to your coaching channel, or turn the coaching into tasks.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Coaching channel
          </p>
          {channels.isError ? (
            <p className="text-sm text-destructive">{errorText(channels.error)}</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={channelValue} onValueChange={setChannelValue}>
                <SelectTrigger className="sm:flex-1">
                  <SelectValue
                    placeholder={channels.isLoading ? "Loading channels..." : "Pick a channel"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(channels.data ?? []).map((channel) => (
                    <SelectItem
                      key={`${channel.teamId}|${channel.channelId}`}
                      value={`${channel.teamId}|${channel.channelId}`}
                    >
                      {channel.teamName} · {channel.channelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => post.mutate()}
                disabled={!channelValue || post.isPending}
                variant="secondary"
              >
                {post.isPending ? "Posting..." : "Post debrief"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <ListTodo className="h-3.5 w-3.5" />
            Follow-up tasks
          </p>
          {linearTeams.isError ? (
            <p className="text-sm text-destructive">{errorText(linearTeams.error)}</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={linearTeamId} onValueChange={setLinearTeamId}>
                <SelectTrigger className="sm:flex-1">
                  <SelectValue
                    placeholder={linearTeams.isLoading ? "Loading teams..." : "Pick a team"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(linearTeams.data ?? []).map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => issues.mutate()}
                disabled={!linearTeamId || issues.isPending}
                variant="secondary"
              >
                {issues.isPending ? "Creating..." : "Create tasks"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

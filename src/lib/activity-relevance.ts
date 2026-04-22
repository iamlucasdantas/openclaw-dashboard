export type RelevantActivityLike = {
  summary: string;
  body: string | null;
  contentUrl?: string | null;
};

export function isRelevantActivity(activity: RelevantActivityLike) {
  return !(
    activity.summary === "Executou ação" &&
    activity.body === "Sem detalhes disponíveis." &&
    !activity.contentUrl
  );
}

export function filterRelevantActivities<T extends RelevantActivityLike>(activities: T[]) {
  return activities.filter(isRelevantActivity);
}

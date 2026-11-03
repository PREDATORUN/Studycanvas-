export type SpacePolicy = {
  ownerId: string;
  memberIds: string[];
  private: boolean;
  closed: boolean;
  kind: string;
};
export function isMember(s: SpacePolicy, uid: string) {
  return s.memberIds.includes(uid);
}
export function canJoin(s: SpacePolicy, uid: string) {
  return (
    !s.closed &&
    !s.private &&
    s.kind !== "class" &&
    !isMember(s, uid) &&
    s.memberIds.length < 100
  );
}
export function canPublish(s: SpacePolicy, uid: string, announcement: boolean) {
  return !s.closed && isMember(s, uid) && (!announcement || s.ownerId === uid);
}

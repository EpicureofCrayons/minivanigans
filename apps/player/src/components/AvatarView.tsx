import type { Avatar } from "@minivanigans/rules-engine";
import { BUILTIN_AVATAR_BY_ID } from "../lib/avatars";
import { useImageUrl } from "../lib/useImageUrl";

/** Renders an avatar as a circular disc: a built-in emoji icon or an uploaded image. */
export function AvatarView({
  avatar,
  size,
  className,
}: {
  avatar: Avatar;
  size: number;
  className?: string;
}) {
  // Hook must run unconditionally; passes undefined for built-in avatars.
  const url = useImageUrl(avatar.kind === "image" ? avatar.ref : undefined);

  if (avatar.kind === "image") {
    return (
      <div
        className={className}
        style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "var(--surface-2)" }}
      >
        {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
    );
  }

  const a = BUILTIN_AVATAR_BY_ID.get(avatar.id);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: a?.bg ?? "#888",
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.55,
        lineHeight: 1,
      }}
    >
      <span aria-hidden>{a?.emoji ?? "🙂"}</span>
    </div>
  );
}

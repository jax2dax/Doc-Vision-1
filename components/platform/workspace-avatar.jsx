export function WorkspaceAvatar({ workspace, size = 28 }) {
  const initials = workspace.name.slice(0, 2).toUpperCase();
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-lg font-display font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        color: workspace.color,
        backgroundColor: `${workspace.color}22`,
        border: `1px solid ${workspace.color}44`,
      }}
    >
      {initials}
    </span>
  );
}
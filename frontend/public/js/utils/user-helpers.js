export function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function calculateProfileStrength(userData) {
  const checks = [
    Boolean(userData.fullName || userData.name),
    Boolean(userData.location),
    Boolean(userData.bio),
    Boolean(
      userData.profileImage &&
      userData.profileImage.startsWith("http")
    )
  ];

  if (userData.role === "athlete") {
    checks.push(
      Boolean(userData.sport),
      Boolean(userData.pbs),
      Boolean(userData.achievements)
    );
  }

  if (userData.role === "professional") {
    checks.push(
      Boolean(userData.professionalCategory),
      Boolean(userData.qualifications),
      Boolean(userData.services)
    );
  }

  const completed =
    checks.filter(Boolean).length;

  return Math.round(
    (completed / checks.length) * 100
  );
}
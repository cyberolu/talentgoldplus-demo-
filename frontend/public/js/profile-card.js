export function createProfileCard(user, options = {}) {

  const {
    profilePage = "profile.html",
    roleLabel = "Member",
    fallbackImage = "../assets/images/avatar-placeholder.png"
  } = options;

  const card =
    document.createElement("article");

  card.className = "platform-profile-card";

  const name =
    user.fullName ||
    user.name ||
    `${roleLabel} Member`;

  const category =
    user.professionalCategory ||
    user.category ||
    user.speciality ||
    roleLabel;

  const image =
    getProfileImage(
      user,
      fallbackImage
    );

  const location =
    getLocation(user);

  const qualification =
    getShortText(
      user.qualifications ||
      user.qualification,
      55
    );

  const experience =
    getExperience(user);

  const description =
    getShortText(
      user.bio ||
      user.services ||
      user.description ||
      `${roleLabel} services and support.`,
      115
    );

  const tags =
    getProfileTags(user);

  const isVerified =
    user.verified === true ||
    user.isVerified === true ||
    normalise(user.verificationStatus) === "verified";

  const verificationBadge =
    isVerified
      ? `
        <span
          class="profile-card-status verified"
          aria-label="Verified profile"
        >
          ✓ Verified
        </span>
      `
      : `
        <span class="profile-card-status">
          ${escapeHTML(roleLabel)}
        </span>
      `;

  const qualificationMarkup =
    qualification
      ? `
        <div class="profile-card-detail">
          <span
            class="profile-card-detail-icon"
            aria-hidden="true"
          >
            🎓
          </span>

          <span>
            ${escapeHTML(qualification)}
          </span>
        </div>
      `
      : "";

  const experienceMarkup =
    experience
      ? `
        <div class="profile-card-detail">
          <span
            class="profile-card-detail-icon"
            aria-hidden="true"
          >
            ★
          </span>

          <span>
            ${escapeHTML(experience)}
          </span>
        </div>
      `
      : "";

  const tagsMarkup =
    createTagsMarkup(tags);

  card.innerHTML = `
    <div class="profile-card-header">

      <div class="profile-card-avatar-wrap">

        <img
          class="profile-card-avatar"
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(name)}"
          loading="lazy"
        >

      </div>

      ${verificationBadge}

    </div>

    <div class="profile-card-body">

      <div class="profile-card-title">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(
            formatLabel(category)
          )}
        </p>

      </div>

      <div class="profile-card-details">

        <div class="profile-card-detail">

          <span
            class="profile-card-detail-icon"
            aria-hidden="true"
          >
            📍
          </span>

          <span>
            ${escapeHTML(location)}
          </span>

        </div>

        ${qualificationMarkup}

        ${experienceMarkup}

      </div>

      <p class="profile-card-description">
        ${escapeHTML(description)}
      </p>

      ${tagsMarkup}

      <a
        href="${profilePage}?user=${encodeURIComponent(user.id)}"
        class="btn-primary profile-card-button"
      >
        View Profile
      </a>

    </div>
  `;

  const profileImage =
    card.querySelector(
      ".profile-card-avatar"
    );

  if (profileImage) {

    profileImage.addEventListener(
      "error",
      () => {

        profileImage.src =
          fallbackImage;

      },
      {
        once: true
      }
    );

  }

  return card;

}

function getProfileImage(
  user,
  fallbackImage
) {

  const image =
    user.profileImage ||
    user.profilePhoto ||
    user.photoURL ||
    user.imageURL ||
    user.avatar ||
    "";

  if (
    typeof image === "string" &&
    image.trim() !== ""
  ) {

    return image.trim();

  }

  return fallbackImage;

}

function getLocation(user) {

  const city =
    cleanValue(user.city);

  const country =
    cleanValue(user.country);

  if (
    city &&
    country &&
    normalise(city) !== normalise(country)
  ) {

    return `${city}, ${country}`;

  }

  return (
    city ||
    country ||
    cleanValue(user.location) ||
    cleanValue(user.organisation) ||
    cleanValue(user.companyName) ||
    "Location unavailable"
  );

}

function getExperience(user) {

  const years =
    user.yearsExperience ??
    user.experienceYears ??
    user.yearsOfExperience;

  if (
    years !== undefined &&
    years !== null &&
    String(years).trim() !== ""
  ) {

    const numericYears =
      Number(years);

    if (!Number.isNaN(numericYears)) {

      if (numericYears === 1) {
        return "1 year experience";
      }

      return `${numericYears} years experience`;

    }

    return cleanValue(years);

  }

  return cleanValue(user.experience);

}

function getProfileTags(user) {

  const source =
    user.specialisms ||
    user.specialties ||
    user.services ||
    user.skills ||
    [];

  let tags = [];

  if (Array.isArray(source)) {

    tags = source;

  } else if (
    typeof source === "string"
  ) {

    tags =
      source.split(/[,|;]/);

  } else if (
    source &&
    typeof source === "object"
  ) {

    tags =
      Object.values(source);

  }

  return tags
    .map((tag) => cleanValue(tag))
    .filter(Boolean);

}

function createTagsMarkup(tags) {

  if (!tags.length) {
    return "";
  }

  const visibleTags =
    tags.slice(0, 3);

  const remainingCount =
    tags.length - visibleTags.length;

  const tagsHTML =
    visibleTags
      .map((tag) => `
        <span class="profile-card-tag">
          ${escapeHTML(tag)}
        </span>
      `)
      .join("");

  const remainingMarkup =
    remainingCount > 0
      ? `
        <span class="profile-card-tag more">
          +${remainingCount} more
        </span>
      `
      : "";

  return `
    <div class="profile-card-tags">
      ${tagsHTML}
      ${remainingMarkup}
    </div>
  `;

}

function getShortText(
  value,
  maximumLength
) {

  const text =
    valueToText(value);

  if (!text) {
    return "";
  }

  if (text.length <= maximumLength) {
    return text;
  }

  return `${text
    .slice(0, maximumLength)
    .trim()}…`;

}

function valueToText(value) {

  if (!value) return "";

  if (Array.isArray(value)) {

    return value
      .join(", ")
      .replace(/\s+/g, " ")
      .trim();

  }

  if (
    typeof value === "object"
  ) {

    return Object
      .values(value)
      .join(", ")
      .replace(/\s+/g, " ")
      .trim();

  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim();

}

function cleanValue(value) {

  if (
    value === undefined ||
    value === null
  ) {

    return "";

  }

  return String(value).trim();

}

function normalise(value) {

  return cleanValue(value)
    .replaceAll("-", " ")
    .toLowerCase();

}

function formatLabel(value) {

  return (
    cleanValue(value) ||
    "Member"
  )
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => {
      return letter.toUpperCase();
    });

}

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function escapeAttribute(value) {

  return escapeHTML(value);

}
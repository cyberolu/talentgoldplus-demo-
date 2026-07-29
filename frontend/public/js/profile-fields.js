const roleFields = {

  athlete: [
    {
      id: "sport",
      type: "select",
      required: true,
      placeholder: "Select Your Sport",
      options: [
        ["football", "Football"],
        ["athletics", "Athletics"],
        ["basketball", "Basketball"],
        ["rugby", "Rugby"],
        ["tennis", "Tennis"],
        ["combat-sports", "Combat Sports"],
        ["other-sports", "Other Sports"]
      ]
    },
    {
      id: "pbs",
      type: "text",
      placeholder: "Personal Best, Position or Event"
    },
    {
      id: "achievements",
      type: "textarea",
      placeholder: "Achievements"
    }
  ],

  professional: [
    {
      id: "professionalCategory",
      type: "select",
      required: true,
      placeholder: "Select Professional Category",
      options: [
        ["coach", "Coach"],
        ["physiotherapist", "Physiotherapist"],
        ["sports-therapist", "Sports Therapist"],
        ["nutritionist", "Nutritionist"],
        ["psychologist", "Psychologist"],
        ["wellbeing-specialist", "Wellbeing Specialist"],
        ["recovery-expert", "Recovery Expert"],
        ["mentor", "Mentor"],
        ["performance-specialist", "Performance Specialist"]
      ]
    },
    {
      id: "qualifications",
      type: "text",
      placeholder: "Qualifications"
    },
    {
      id: "services",
      type: "textarea",
      placeholder: "Services Offered"
    }
  ],

  scout: [
    {
      id: "sport",
      type: "select",
      placeholder: "Primary Sport",
      options: [
        ["football", "Football"],
        ["athletics", "Athletics"],
        ["basketball", "Basketball"],
        ["rugby", "Rugby"],
        ["tennis", "Tennis"],
        ["combat-sports", "Combat Sports"],
        ["swimming", "Swimming"],
        ["cycling", "Cycling"],
        ["cricket", "Cricket"],
        ["gymnastics", "Gymnastics"],
        ["netball", "Netball"],
        ["volleyball", "Volleyball"],
        ["other-sports", "Other Sports"]
      ]
    },
    {
      id: "organisation",
      type: "text",
      placeholder: "Organisation"
    },
    {
      id: "scoutingRegion",
      type: "text",
      placeholder: "Scouting Region"
    }
  ],

  investor: [
    {
      id: "companyName",
      type: "text",
      placeholder: "Company or Organisation"
    },
    {
      id: "investmentInterests",
      type: "text",
      placeholder: "Investment Interests"
    },
    {
      id: "fundingRange",
      type: "text",
      placeholder: "Funding Range"
    }
  ],

  partner: [
    {
      id: "organisationName",
      type: "text",
      placeholder: "Organisation Name",
      required: true
    },
    {
      id: "contactPerson",
      type: "text",
      placeholder: "Primary Contact Person",
      required: true
    },
    {
      id: "partnerType",
      type: "select",
      placeholder: "Select Partner Type",
      required: true,
      options: [
        ["sports-organisation", "Sports Organisation"],
        ["sports-club", "Sports Club"],
        ["corporate-partner", "Corporate Partner"],
        ["educational-institution", "Educational Institution"],
        ["technology-partner", "Technology Partner"],
        ["media-partner", "Media Partner"],
        ["community-partner", "Community Partner"],
        ["healthcare-partner", "Healthcare Partner"],
        ["government-agency", "Government Agency"],
        ["non-profit-organisation", "Non Profit Organisation"],
        ["other", "Other"]
      ]
    },
    {
      id: "website",
      type: "url",
      placeholder: "Website"
    },
    {
      id: "phone",
      type: "tel",
      placeholder: "Phone Number"
    },
    {
      id: "country",
      type: "text",
      placeholder: "Country"
    },
    {
      id: "organisationDescription",
      type: "textarea",
      placeholder: "Tell the TalentGoldPlus community about your organisation."
    },
    {
      id: "facebook",
      type: "url",
      placeholder: "Facebook URL"
    },
    {
      id: "instagram",
      type: "url",
      placeholder: "Instagram URL"
    },
    {
      id: "linkedin",
      type: "url",
      placeholder: "LinkedIn URL"
    }
  ]

};

function createFieldHtml(field) {

  const requiredAttribute =
    field.required ? "required" : "";

  if (field.type === "select") {

    const optionsHtml =
      field.options
        .map(([value, label]) => {
          return `
            <option value="${value}">
              ${label}
            </option>
          `;
        })
        .join("");

    return `
      <div class="form-group">
        <select id="${field.id}" ${requiredAttribute}>
          <option value="">
            ${field.placeholder}
          </option>

          ${optionsHtml}
        </select>
      </div>
    `;
  }

  if (field.type === "textarea") {

    return `
      <div class="form-group">
        <textarea
          id="${field.id}"
          rows="5"
          placeholder="${field.placeholder}"
          ${requiredAttribute}
        ></textarea>
      </div>
    `;
  }

  return `
    <div class="form-group">
      <input
        type="${field.type}"
        id="${field.id}"
        placeholder="${field.placeholder}"
        ${requiredAttribute}
      >
    </div>
  `;
}

export function renderRoleFields(container, role) {

  if (!container) return;

  const fields =
    roleFields[role] || [];

  container.innerHTML =
    fields
      .map(createFieldHtml)
      .join("");
}

export function populateRoleFields(role, userData) {

  const fields =
    roleFields[role] || [];

  fields.forEach((field) => {

    const element =
      document.getElementById(field.id);

    if (!element) return;

    element.value =
      userData[field.id] || "";

  });

}

export function collectRoleFields(role) {

  const fields =
    roleFields[role] || [];

  const roleData = {};

  fields.forEach((field) => {

    const element =
      document.getElementById(field.id);

    roleData[field.id] =
      element?.value?.trim() || "";

  });

  return roleData;
}
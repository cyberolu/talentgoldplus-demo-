import {
  auth,
  db
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


const opportunityForm =
  document.getElementById(
    "opportunityForm"
  );

const opportunitiesGrid =
  document.getElementById(
    "opportunitiesGrid"
  );

const opportunitySearch =
  document.getElementById(
    "opportunitySearch"
  );

const opportunityCategoryFilter =
  document.getElementById(
    "opportunityCategoryFilter"
  );


let currentUser =
  null;

let currentUserData =
  null;

let allOpportunities =
  [];

let editingOpportunityId =
  null;


const params =
  new URLSearchParams(
    window.location.search
  );


editingOpportunityId =
  params.get(
    "edit"
  );


onAuthStateChanged(
  auth,
  async (user) => {

    currentUser =
      user;


    if (
      user
    ) {

      const userSnap =
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );


      if (
        userSnap.exists()
      ) {

        currentUserData =
          userSnap.data();

      }


      if (
        opportunityForm &&
        editingOpportunityId
      ) {

        await loadOpportunityForEditing();

      }

    }


    if (
      opportunitiesGrid
    ) {

      await loadOpportunities();

    }

  }
);


/* =========================
   EDIT LOAD
========================= */

async function loadOpportunityForEditing() {

  try {

    const opportunityRef =
      doc(
        db,
        "opportunities",
        editingOpportunityId
      );


    const snapshot =
      await getDoc(
        opportunityRef
      );


    if (
      !snapshot.exists()
    ) {

      throw new Error(
        "Opportunity not found."
      );

    }


    const data =
      snapshot.data();


    if (
      data.createdBy !==
      currentUser.uid
    ) {

      throw new Error(
        "You cannot edit this opportunity."
      );

    }


    const status =
      (
        data.status ||
        ""
      ).toLowerCase();


    if (
      status !== "pending" &&
      status !== "rejected"
    ) {

      alert(
        "Approved opportunities cannot be edited directly."
      );

      window.location.href =
        "my-submissions.html#opportunities";

      return;

    }


    setValue(
      "opportunityTitle",
      data.title
    );

    setValue(
      "opportunityCategory",
      data.category
    );

    setValue(
      "opportunityDescription",
      data.description
    );

    setValue(
      "opportunityOrganisation",
      data.organisation
    );

    setValue(
      "opportunityLocation",
      data.location
    );

    setValue(
      "opportunityClosingDate",
      data.closingDate
    );

    setValue(
      "opportunityApplyLink",
      data.applyLink
    );

    setValue(
      "opportunityContactEmail",
      data.contactEmail
    );


    const heading =
      document.querySelector(
        ".auth-card h1"
      );


    if (
      heading
    ) {

      heading.textContent =
        status === "rejected"
          ? "Edit & Resubmit Opportunity"
          : "Edit Opportunity";

    }


    const button =
      opportunityForm.querySelector(
        'button[type="submit"]'
      );


    if (
      button
    ) {

      button.textContent =
        status === "rejected"
          ? "Resubmit Opportunity"
          : "Save Changes";

    }

  } catch (error) {

    console.error(
      "Opportunity edit load error:",
      error
    );


    alert(
      error.message
    );


    window.location.href =
      "my-submissions.html#opportunities";

  }

}


/* =========================
   CREATE / UPDATE
========================= */

if (
  opportunityForm
) {

  opportunityForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (
        !currentUser
      ) {

        alert(
          "Please login before posting an opportunity."
        );

        return;

      }


      const title =
        getValue(
          "opportunityTitle"
        );

      const category =
        getValue(
          "opportunityCategory"
        );

      const description =
        getValue(
          "opportunityDescription"
        );

      const organisation =
        getValue(
          "opportunityOrganisation"
        );

      const location =
        getValue(
          "opportunityLocation"
        );

      const closingDate =
        getValue(
          "opportunityClosingDate"
        );

      const applyLink =
        getValue(
          "opportunityApplyLink"
        );

      const contactEmail =
        getValue(
          "opportunityContactEmail"
        );


      if (
        !applyLink &&
        !contactEmail
      ) {

        alert(
          "Please add either an application link or a contact email."
        );

        return;

      }


      try {

        if (
          editingOpportunityId
        ) {

          const opportunityRef =
            doc(
              db,
              "opportunities",
              editingOpportunityId
            );


          const currentSnap =
            await getDoc(
              opportunityRef
            );


          if (
            !currentSnap.exists()
          ) {

            throw new Error(
              "Opportunity not found."
            );

          }


          const original =
            currentSnap.data();


          if (
            original.createdBy !==
            currentUser.uid
          ) {

            throw new Error(
              "You cannot edit this opportunity."
            );

          }


          const status =
            (
              original.status ||
              ""
            ).toLowerCase();


          if (
            status !== "pending" &&
            status !== "rejected"
          ) {

            throw new Error(
              "Approved opportunities cannot be edited directly."
            );

          }


          await updateDoc(
            opportunityRef,
            {
              title,
              category,
              description,
              organisation,
              location,
              closingDate,
              applyLink,
              contactEmail,

              status:
                "pending",

              rejectionReason:
                "",

              rejectedBy:
                "",

              rejectedAt:
                null,

              updatedAt:
                serverTimestamp()
            }
          );


          alert(
            status === "rejected"
              ? "Your opportunity has been resubmitted for approval."
              : "Your opportunity has been updated."
          );


          window.location.href =
            "my-submissions.html#opportunities";

          return;

        }


        await addDoc(
          collection(
            db,
            "opportunities"
          ),
          {
            title,
            category,
            description,
            organisation,
            location,
            closingDate,
            applyLink,
            contactEmail,

            createdBy:
              currentUser.uid,

            createdByName:
              currentUserData?.fullName ||
              currentUserData?.name ||
              "TalentGoldPlus User",

            status:
              "pending",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()
          }
        );


        alert(
          "Opportunity submitted successfully."
        );


        window.location.href =
          "my-submissions.html#opportunities";

      } catch (error) {

        console.error(
          "Opportunity submission error:",
          error
        );


        alert(
          error.message ||
          "The opportunity could not be saved."
        );

      }

    }
  );

}


/* =========================
   LOAD PUBLIC OPPORTUNITIES
========================= */

async function loadOpportunities() {

  opportunitiesGrid.innerHTML =
    "<p>Loading opportunities...</p>";


  const opportunitiesQuery =
    query(
      collection(
        db,
        "opportunities"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  const snapshot =
    await getDocs(
      opportunitiesQuery
    );


  allOpportunities =
    [];


  snapshot.forEach(
    (opportunityDoc) => {

      const opportunity =
        opportunityDoc.data();


      if (
        opportunity.status !==
        "approved"
      ) {

        return;

      }


      if (
        opportunity.closingDate &&
        new Date(
          opportunity.closingDate
        ) <
        new Date()
      ) {

        return;

      }


      allOpportunities.push({
        id:
          opportunityDoc.id,

        ...opportunity
      });

    }
  );


  renderOpportunities(
    allOpportunities
  );

}


/* =========================
   RENDER
========================= */

function renderOpportunities(
  opportunities
) {

  opportunitiesGrid.innerHTML =
    "";


  if (
    !opportunities.length
  ) {

    opportunitiesGrid.innerHTML = `
      <div class="empty-state">

        <h2>
          No Opportunities Yet
        </h2>

        <p>
          Approved opportunities will appear here once reviewed.
        </p>

        <a
          href="create-opportunity.html"
          class="btn-primary"
        >
          Post Opportunity
        </a>

      </div>
    `;

    return;

  }


  opportunities.forEach(
    (opportunity) => {

      const card =
        document.createElement(
          "div"
        );


      card.classList.add(
        "opportunity-card"
      );


      card.innerHTML = `

        <span class="opportunity-category">
          ${formatText(
            opportunity.category
          )}
        </span>

        <h3>
          ${escapeHtml(
            opportunity.title
          )}
        </h3>

        <p class="opportunity-description">
          ${escapeHtml(
            opportunity.description
          )}
        </p>

        <div class="opportunity-meta">

          <p>
            <strong>Organisation:</strong>
            ${escapeHtml(
              opportunity.organisation ||
              "Not specified"
            )}
          </p>

          <p>
            <strong>Location:</strong>
            ${escapeHtml(
              opportunity.location ||
              "Online / Not specified"
            )}
          </p>

          <p>
            <strong>Closing Date:</strong>
            ${formatDate(
              opportunity.closingDate
            )}
          </p>

        </div>

        <div class="opportunity-actions">

          ${
            opportunity.applyLink
              ? `
                <a
                  href="${opportunity.applyLink}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-primary"
                >
                  Apply Now
                </a>
              `
              : ""
          }

          ${
            opportunity.contactEmail
              ? `
                <a
                  href="mailto:${opportunity.contactEmail}"
                  class="btn-secondary"
                >
                  Contact
                </a>
              `
              : ""
          }

        </div>
      `;


      opportunitiesGrid.appendChild(
        card
      );

    }
  );

}


/* =========================
   FILTERS
========================= */

function applyOpportunityFilters() {

  const searchTerm =
    opportunitySearch
      ?.value
      .toLowerCase()
      .trim() ||
    "";


  const selectedCategory =
    opportunityCategoryFilter
      ?.value ||
    "all";


  const filtered =
    allOpportunities.filter(
      (opportunity) => {

        const matchesSearch =
          opportunity.title
            ?.toLowerCase()
            .includes(
              searchTerm
            ) ||

          opportunity.description
            ?.toLowerCase()
            .includes(
              searchTerm
            ) ||

          opportunity.location
            ?.toLowerCase()
            .includes(
              searchTerm
            ) ||

          opportunity.organisation
            ?.toLowerCase()
            .includes(
              searchTerm
            );


        const matchesCategory =
          selectedCategory ===
            "all" ||

          opportunity.category ===
            selectedCategory;


        return (
          matchesSearch &&
          matchesCategory
        );

      }
    );


  renderOpportunities(
    filtered
  );

}


if (
  opportunitySearch
) {

  opportunitySearch.addEventListener(
    "input",
    applyOpportunityFilters
  );

}


if (
  opportunityCategoryFilter
) {

  opportunityCategoryFilter.addEventListener(
    "change",
    applyOpportunityFilters
  );

}


/* =========================
   HELPERS
========================= */

function getValue(
  id
) {

  return (
    document
      .getElementById(id)
      ?.value
      ?.trim() ||
    ""
  );

}


function setValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (
    element
  ) {

    element.value =
      value ||
      "";

  }

}


function formatText(
  value
) {

  return (
    value ||
    "General"
  )
    .toString()
    .replaceAll(
      "-",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );

}


function formatDate(
  value
) {

  if (
    !value
  ) {

    return "Not specified";

  }


  return new Date(
    value
  ).toLocaleDateString(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric"
    }
  );

}


function escapeHtml(
  value = ""
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      "\"",
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}
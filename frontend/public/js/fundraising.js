import {
  auth,
  db,
  storage
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

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


/* =========================
   PAGE ELEMENTS
========================= */

const fundraiserForm =
  document.getElementById(
    "fundraiserForm"
  );

const startFundraisingBtn =
  document.getElementById(
    "startFundraisingBtn"
  );

const fundraisersGrid =
  document.getElementById(
    "fundraisersGrid"
  );

const fundraiserDetail =
  document.getElementById(
    "fundraiserDetail"
  );


/* =========================
   STATE
========================= */

let currentUser =
  null;

let currentUserData =
  null;

let editingFundraiserId =
  null;

let existingFundraiserImage =
  "";


/* =========================
   CHECK FOR EDIT MODE
========================= */

const fundraiserParams =
  new URLSearchParams(
    window.location.search
  );

editingFundraiserId =
  fundraiserParams.get(
    "edit"
  );


/* =========================
   AUTH
========================= */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser =
      user;


    if (
      startFundraisingBtn
    ) {

      startFundraisingBtn.style.display =
        user
          ? "inline-flex"
          : "none";

    }


    if (
      user
    ) {

      try {

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


        /*
          If create-fundraiser.html was opened
          with ?edit=DOCUMENT_ID, load the
          existing fundraiser into the form.
        */
        if (
          fundraiserForm &&
          editingFundraiserId
        ) {

          await loadFundraiserForEditing();

        }

      } catch (error) {

        console.error(
          "Unable to load user details:",
          error
        );

      }

    }


    if (
      fundraisersGrid
    ) {

      await loadFundraisers();

    }


    if (
      fundraiserDetail
    ) {

      await loadFundraiserDetail();

    }

  }
);


/* =========================================================
   LOAD FUNDRAISER FOR EDITING
========================================================= */

async function loadFundraiserForEditing() {

  try {

    const fundraiserRef =
      doc(
        db,
        "fundraisers",
        editingFundraiserId
      );


    const fundraiserSnap =
      await getDoc(
        fundraiserRef
      );


    if (
      !fundraiserSnap.exists()
    ) {

      alert(
        "This fundraiser could not be found."
      );

      window.location.href =
        "my-submissions.html#fundraisers";

      return;

    }


    const fundraiser =
      fundraiserSnap.data();


    /* OWNER CHECK */

    if (
      fundraiser.createdBy !==
      currentUser.uid
    ) {

      alert(
        "You do not have permission to edit this fundraiser."
      );

      window.location.href =
        "my-submissions.html#fundraisers";

      return;

    }


    const status =
      (
        fundraiser.status ||
        ""
      ).toLowerCase();


    /*
      Only pending and rejected
      submissions can be edited.
    */

    if (
      status !== "pending" &&
      status !== "rejected"
    ) {

      alert(
        "Approved fundraisers cannot be edited directly."
      );

      window.location.href =
        "my-submissions.html#fundraisers";

      return;

    }


    /* KEEP EXISTING IMAGE */

    existingFundraiserImage =
      fundraiser.fundraiserImage ||
      "";


    /* =========================
       FILL FORM
    ========================= */

    setValue(
      "fundraiserTitle",
      fundraiser.title
    );

    setValue(
      "fundraiserPurpose",
      fundraiser.purpose
    );

    setValue(
      "fundraiserSport",
      fundraiser.sport
    );

    setValue(
      "targetAmount",
      fundraiser.targetAmount
    );

    setValue(
      "fundraiserLocation",
      fundraiser.location
    );

    setValue(
      "fundraiserDeadline",
      fundraiser.deadline
    );

    setValue(
      "fundraiserStory",
      fundraiser.story
    );


    /* =========================
       CHANGE PAGE HEADING
    ========================= */

    const heading =
      document.querySelector(
        ".auth-card h1"
      );


    if (
      heading
    ) {

      heading.textContent =
        status === "rejected"
          ? "Edit & Resubmit Fundraiser"
          : "Edit Fundraiser";

    }


    /* =========================
       CHANGE BUTTON
    ========================= */

    const submitButton =
      fundraiserForm.querySelector(
        'button[type="submit"]'
      );


    if (
      submitButton
    ) {

      submitButton.textContent =
        status === "rejected"
          ? "Resubmit Fundraiser"
          : "Save Changes";

    }

  } catch (error) {

    console.error(
      "Unable to load fundraiser for editing:",
      error
    );


    alert(
      "The fundraiser could not be loaded."
    );


    window.location.href =
      "my-submissions.html#fundraisers";

  }

}


/* =========================================================
   CREATE OR UPDATE FUNDRAISER
========================================================= */

if (
  fundraiserForm
) {

  fundraiserForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (
        !currentUser
      ) {

        alert(
          "Please log in before creating a fundraiser."
        );

        return;

      }


      const submitButton =
        fundraiserForm.querySelector(
          'button[type="submit"]'
        );


      if (
        submitButton
      ) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          editingFundraiserId
            ? "Saving..."
            : "Submitting...";

      }


      try {

        /* =========================
           FORM VALUES
        ========================= */

        const title =
          getValue(
            "fundraiserTitle"
          );

        const purpose =
          getValue(
            "fundraiserPurpose"
          );

        const sport =
          getValue(
            "fundraiserSport"
          );

        const targetAmount =
          Number(
            getValue(
              "targetAmount"
            )
          );

        const location =
          getValue(
            "fundraiserLocation"
          );

        const deadline =
          getValue(
            "fundraiserDeadline"
          );

        const story =
          getValue(
            "fundraiserStory"
          );


        if (
          !title ||
          !purpose ||
          !story
        ) {

          throw new Error(
            "Please complete all required fundraiser fields."
          );

        }


        if (
          !Number.isFinite(
            targetAmount
          ) ||
          targetAmount <= 0
        ) {

          throw new Error(
            "Please enter a valid target amount."
          );

        }


        /* =========================
           IMAGE
        ========================= */

        const imageFile =
          document
            .getElementById(
              "fundraiserImage"
            )
            ?.files?.[0];


        /*
          In edit mode this starts with
          the old image.

          If a new image is uploaded,
          it replaces the old URL.
        */

        let fundraiserImage =
          existingFundraiserImage;


        if (
          imageFile
        ) {

          if (
            !imageFile.type.startsWith(
              "image/"
            )
          ) {

            throw new Error(
              "Please choose a valid image file."
            );

          }


          const safeFileName =
            imageFile.name.replace(
              /[^a-zA-Z0-9._-]/g,
              "-"
            );


          const imageRef =
            ref(
              storage,
              `fundraisers/${currentUser.uid}/${Date.now()}-${safeFileName}`
            );


          await uploadBytes(
            imageRef,
            imageFile,
            {
              contentType:
                imageFile.type
            }
          );


          fundraiserImage =
            await getDownloadURL(
              imageRef
            );

        }


        /* =================================================
           EDIT EXISTING FUNDRAISER
        ================================================= */

        if (
          editingFundraiserId
        ) {

          const fundraiserRef =
            doc(
              db,
              "fundraisers",
              editingFundraiserId
            );


          /*
            Read it again before updating.
            Do not rely only on what was
            loaded when the page opened.
          */

          const fundraiserSnap =
            await getDoc(
              fundraiserRef
            );


          if (
            !fundraiserSnap.exists()
          ) {

            throw new Error(
              "This fundraiser no longer exists."
            );

          }


          const original =
            fundraiserSnap.data();


          /* OWNER CHECK */

          if (
            original.createdBy !==
            currentUser.uid
          ) {

            throw new Error(
              "You do not have permission to edit this fundraiser."
            );

          }


          const originalStatus =
            (
              original.status ||
              ""
            ).toLowerCase();


          /*
            Do not allow someone to edit
            an already approved fundraiser.
          */

          if (
            originalStatus !== "pending" &&
            originalStatus !== "rejected"
          ) {

            throw new Error(
              "Approved fundraisers cannot be edited directly."
            );

          }


          await updateDoc(
            fundraiserRef,
            {
              title,

              purpose,

              sport,

              targetAmount,

              location,

              deadline,

              story,

              fundraiserImage,


              /*
                Every edit/resubmission is
                returned to pending review.
              */

              status:
                "pending",


              /*
                Clear old rejection details
                after resubmission.
              */

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


          if (
            originalStatus ===
            "rejected"
          ) {

            alert(
              "Your fundraiser has been updated and resubmitted for approval."
            );

          } else {

            alert(
              "Your fundraiser changes have been saved."
            );

          }


          window.location.href =
            "my-submissions.html#fundraisers";


          return;

        }


        /* =================================================
           CREATE NEW FUNDRAISER
        ================================================= */

        await addDoc(
          collection(
            db,
            "fundraisers"
          ),
          {
            title,

            purpose,

            sport,

            targetAmount,

            amountRaised:
              0,

            location,

            deadline,

            story,

            fundraiserImage,


            createdBy:
              currentUser.uid,


            createdByName:
              currentUserData?.fullName ||
              currentUserData?.name ||
              "TalentGoldPlus User",


            createdByRole:
              currentUserData?.role ||
              "member",


            status:
              "pending",


            createdAt:
              serverTimestamp(),


            updatedAt:
              serverTimestamp()
          }
        );


        alert(
          "Your fundraising request has been submitted for approval."
        );


        /*
          Important:
          Take the creator to their own
          submission page, not the public
          fundraising page.
        */

        window.location.href =
          "my-submissions.html#fundraisers";

      } catch (error) {

        console.error(
          "Fundraiser submission error:",
          error
        );


        alert(
          error.message ||
          "The fundraising request could not be saved."
        );

      } finally {

        if (
          submitButton
        ) {

          submitButton.disabled =
            false;


          if (
            editingFundraiserId
          ) {

            submitButton.textContent =
              "Save Changes";

          } else {

            submitButton.textContent =
              "Submit Fundraiser";

          }

        }

      }

    }
  );

}


/* =========================================================
   LOAD PUBLIC FUNDRAISERS
========================================================= */

async function loadFundraisers() {

  fundraisersGrid.innerHTML =
    "<p>Loading fundraisers...</p>";


  try {

    const fundraisersQuery =
      query(
        collection(
          db,
          "fundraisers"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(
        fundraisersQuery
      );


    const fundraisers =
      [];


    snapshot.forEach(
      (fundraiserDoc) => {

        const fundraiser =
          fundraiserDoc.data();


        /*
          Public page only shows
          approved fundraisers.
        */

        if (
          fundraiser.status !==
          "approved"
        ) {

          return;

        }


        if (
          fundraiser.deadline &&
          new Date(
            fundraiser.deadline
          ) <
          new Date()
        ) {

          return;

        }


        fundraisers.push({
          id:
            fundraiserDoc.id,

          ...fundraiser
        });

      }
    );


    renderFundraisers(
      fundraisers
    );

  } catch (error) {

    console.error(
      "Unable to load fundraisers:",
      error
    );


    fundraisersGrid.innerHTML = `
      <div class="empty-state">

        <h2>
          Unable to Load Fundraisers
        </h2>

        <p>
          Please refresh the page and try again.
        </p>

      </div>
    `;

  }

}


/* =========================================================
   RENDER FUNDRAISERS
========================================================= */

function renderFundraisers(
  fundraisers
) {

  fundraisersGrid.innerHTML =
    "";


  if (
    !fundraisers.length
  ) {

    fundraisersGrid.innerHTML = `
      <div class="empty-state">

        <h2>
          No Fundraisers Yet
        </h2>

        <p>
          Approved fundraising pages will appear here once submitted and reviewed.
        </p>

        <a
          href="create-fundraiser.html"
          class="btn-primary"
        >
          Start Fundraising
        </a>

      </div>
    `;


    return;

  }


  fundraisers.forEach(
    (fundraiser) => {

      const raised =
        Number(
          fundraiser.amountRaised ||
          0
        );


      const target =
        Number(
          fundraiser.targetAmount ||
          0
        );


      const percentage =
        target > 0
          ? Math.min(
              Math.round(
                (
                  raised /
                  target
                ) *
                100
              ),
              100
            )
          : 0;


      const image =
        fundraiser.fundraiserImage &&
        fundraiser.fundraiserImage
          .startsWith(
            "http"
          )
          ? fundraiser.fundraiserImage
          : "../assets/images/TalentGoldPlus.png";


      const card =
        document.createElement(
          "article"
        );


      card.classList.add(
        "fundraiser-card"
      );


      card.innerHTML = `

        <img
          src="${image}"
          alt="${escapeHtml(
            fundraiser.title ||
            "Fundraiser"
          )}"
          class="fundraiser-image"
          loading="lazy"
        >


        <div class="fundraiser-body">

          <span class="fundraiser-purpose">

            ${formatText(
              fundraiser.purpose
            )}

          </span>


          <h3>

            ${escapeHtml(
              fundraiser.title ||
              "Untitled Fundraiser"
            )}

          </h3>


          <p class="fundraiser-story">

            ${escapeHtml(
              fundraiser.story ||
              "No story added."
            )}

          </p>


          <div class="fundraiser-meta">

            <p>

              <strong>
                Sport:
              </strong>

              ${escapeHtml(
                fundraiser.sport ||
                "Not specified"
              )}

            </p>


            <p>

              <strong>
                Location:
              </strong>

              ${escapeHtml(
                fundraiser.location ||
                "Not specified"
              )}

            </p>

          </div>


          <div
            class="fundraiser-progress"
            aria-label="${percentage}% funded"
          >

            <div
              class="fundraiser-progress-bar"
              style="width: ${percentage}%"
            ></div>

          </div>


          <p class="fundraiser-money">

            £${raised.toLocaleString(
              "en-GB"
            )}

            raised of

            £${target.toLocaleString(
              "en-GB"
            )}

          </p>


          <p class="fundraiser-deadline">

            <strong>
              Deadline:
            </strong>

            ${formatDate(
              fundraiser.deadline
            )}

          </p>


          <a
            href="fundraiser-details.html?id=${fundraiser.id}"
            class="btn-primary fundraiser-view-btn"
          >
            View Fundraiser
          </a>

        </div>
      `;


      fundraisersGrid.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   FUNDRAISER DETAILS
========================================================= */

async function loadFundraiserDetail() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const fundraiserId =
    params.get(
      "id"
    );


  if (
    !fundraiserId
  ) {

    fundraiserDetail.innerHTML =
      "<p>No fundraiser selected.</p>";


    return;

  }


  try {

    const fundraiserRef =
      doc(
        db,
        "fundraisers",
        fundraiserId
      );


    const fundraiserSnap =
      await getDoc(
        fundraiserRef
      );


    if (
      !fundraiserSnap.exists()
    ) {

      fundraiserDetail.innerHTML =
        "<p>This fundraiser could not be found.</p>";


      return;

    }


    const fundraiser =
      fundraiserSnap.data();


    if (
      fundraiser.status !==
      "approved"
    ) {

      fundraiserDetail.innerHTML =
        "<p>This fundraiser is not currently available.</p>";


      return;

    }


    const raised =
      Number(
        fundraiser.amountRaised ||
        0
      );


    const target =
      Number(
        fundraiser.targetAmount ||
        0
      );


    const percentage =
      target > 0
        ? Math.min(
            Math.round(
              (
                raised /
                target
              ) *
              100
            ),
            100
          )
        : 0;


    const image =
      fundraiser.fundraiserImage &&
      fundraiser.fundraiserImage
        .startsWith(
          "http"
        )
        ? fundraiser.fundraiserImage
        : "../assets/images/TalentGoldPlus.png";


    fundraiserDetail.innerHTML = `

      <article class="fundraiser-detail-card">


        <img
          src="${image}"
          alt="${escapeHtml(
            fundraiser.title ||
            "Fundraiser"
          )}"
          class="fundraiser-detail-image"
        >


        <div class="fundraiser-detail-content">


          <span class="fundraiser-purpose">

            ${formatText(
              fundraiser.purpose
            )}

          </span>


          <h1>

            ${escapeHtml(
              fundraiser.title ||
              "Untitled Fundraiser"
            )}

          </h1>


          <p>

            <strong>
              Sport:
            </strong>

            ${escapeHtml(
              fundraiser.sport ||
              "Not specified"
            )}

          </p>


          <p>

            <strong>
              Location:
            </strong>

            ${escapeHtml(
              fundraiser.location ||
              "Not specified"
            )}

          </p>


          <p>

            <strong>
              Created By:
            </strong>

            ${escapeHtml(
              fundraiser.createdByName ||
              "TalentGoldPlus User"
            )}

          </p>


          <div
            class="fundraiser-progress"
            aria-label="${percentage}% funded"
          >

            <div
              class="fundraiser-progress-bar"
              style="width: ${percentage}%"
            ></div>

          </div>


          <p class="fundraiser-money">

            £${raised.toLocaleString(
              "en-GB"
            )}

            raised of

            £${target.toLocaleString(
              "en-GB"
            )}

            (${percentage}%)

          </p>


          <p>

            <strong>
              Deadline:
            </strong>

            ${formatDate(
              fundraiser.deadline
            )}

          </p>


          <h2>
            Story
          </h2>


          <p class="fundraiser-full-story">

            ${escapeHtml(
              fundraiser.story ||
              "No story added."
            )}

          </p>


          <button
            type="button"
            class="btn-primary fundraiser-donate-btn"
            disabled
          >
            Donate Coming Soon
          </button>


        </div>

      </article>
    `;

  } catch (error) {

    console.error(
      "Unable to load fundraiser details:",
      error
    );


    fundraiserDetail.innerHTML = `
      <p>
        This fundraiser could not be loaded.
        Please try again.
      </p>
    `;

  }

}


/* =========================================================
   HELPERS
========================================================= */

function getValue(
  id
) {

  return (
    document
      .getElementById(
        id
      )
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
      value ??
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
    `${value}T00:00:00`
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
  value
) {

  return String(
    value ||
    ""
  )
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
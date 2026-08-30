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


const listingForm =
  document.getElementById(
    "listingForm"
  );

const marketplaceGrid =
  document.getElementById(
    "marketplaceGrid"
  );

const marketplaceSearch =
  document.getElementById(
    "marketplaceSearch"
  );

const marketplaceCategoryFilter =
  document.getElementById(
    "marketplaceCategoryFilter"
  );


let currentUser =
  null;

let currentUserData =
  null;

let allListings =
  [];

let editingListingId =
  null;

let existingListingImage =
  "";


/* =========================
   EDIT PARAMETER
========================= */

const listingParams =
  new URLSearchParams(
    window.location.search
  );

editingListingId =
  listingParams.get(
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


    if (user) {

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
        listingForm &&
        editingListingId
      ) {

        await loadListingForEditing();

      }

    }


    if (
      marketplaceGrid
    ) {

      await loadMarketplaceListings();

    }

  }
);


/* =========================
   LOAD LISTING FOR EDIT
========================= */

async function loadListingForEditing() {

  try {

    const listingRef =
      doc(
        db,
        "marketplaceListings",
        editingListingId
      );


    const listingSnap =
      await getDoc(
        listingRef
      );


    if (
      !listingSnap.exists()
    ) {

      alert(
        "This listing could not be found."
      );

      window.location.href =
        "/my-submissions#marketplace";

      return;

    }


    const listing =
      listingSnap.data();


    if (
      listing.userId !==
      currentUser.uid
    ) {

      alert(
        "You do not have permission to edit this listing."
      );

      window.location.href =
        "/my-submissions#marketplace";

      return;

    }


    const status =
      (
        listing.status ||
        ""
      ).toLowerCase();


    if (
      status !== "pending" &&
      status !== "rejected"
    ) {

      alert(
        "Approved listings cannot be edited directly."
      );

      window.location.href =
        "/my-submissions#marketplace";

      return;

    }


    existingListingImage =
      listing.listingImage ||
      "";


    setValue(
      "listingTitle",
      listing.title
    );

    setValue(
      "listingCategory",
      listing.category
    );

    setValue(
      "listingDescription",
      listing.description
    );

    setValue(
      "listingPrice",
      listing.price
    );

    setValue(
      "listingLocation",
      listing.location
    );


    const heading =
      document.querySelector(
        ".auth-card h1"
      );


    if (heading) {

      heading.textContent =
        status === "rejected"
          ? "Edit & Resubmit Listing"
          : "Edit Listing";

    }


    const submitButton =
      listingForm.querySelector(
        'button[type="submit"]'
      );


    if (submitButton) {

      submitButton.textContent =
        status === "rejected"
          ? "Resubmit Listing"
          : "Save Changes";

    }

  } catch (error) {

    console.error(
      "Unable to load listing for editing:",
      error
    );

    alert(
      "The listing could not be loaded."
    );

  }

}


/* =========================
   CREATE / UPDATE LISTING
========================= */

if (
  listingForm
) {

  listingForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (
        !currentUser
      ) {

        alert(
          "Please login before creating a listing."
        );

        return;

      }


      const submitButton =
        listingForm.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          editingListingId
            ? "Saving..."
            : "Submitting...";

      }


      try {

        const title =
          getValue(
            "listingTitle"
          );

        const category =
          getValue(
            "listingCategory"
          );

        const description =
          getValue(
            "listingDescription"
          );

        const price =
          getValue(
            "listingPrice"
          );

        const location =
          getValue(
            "listingLocation"
          );


        const imageFile =
          document
            .getElementById(
              "listingImage"
            )
            ?.files?.[0];


        let listingImage =
          existingListingImage;


        if (
          imageFile
        ) {

          const safeFileName =
            imageFile.name
              .replace(
                /[^a-zA-Z0-9._-]/g,
                "-"
              );


          const imageRef =
            ref(
              storage,
              `marketplaceListings/${currentUser.uid}/${Date.now()}-${safeFileName}`
            );


          await uploadBytes(
            imageRef,
            imageFile,
            {
              contentType:
                imageFile.type
            }
          );


          listingImage =
            await getDownloadURL(
              imageRef
            );

        }


        /* UPDATE */

        if (
          editingListingId
        ) {

          const listingRef =
            doc(
              db,
              "marketplaceListings",
              editingListingId
            );


          const listingSnap =
            await getDoc(
              listingRef
            );


          if (
            !listingSnap.exists()
          ) {

            throw new Error(
              "Listing not found."
            );

          }


          const original =
            listingSnap.data();


          if (
            original.userId !==
            currentUser.uid
          ) {

            throw new Error(
              "You do not have permission to edit this listing."
            );

          }


          const originalStatus =
            (
              original.status ||
              ""
            ).toLowerCase();


          if (
            originalStatus !==
              "pending" &&
            originalStatus !==
              "rejected"
          ) {

            throw new Error(
              "Approved listings cannot be edited directly."
            );

          }


          await updateDoc(
            listingRef,
            {
              title,
              category,
              description,
              price,
              location,
              listingImage,

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
            originalStatus ===
              "rejected"
              ? "Your listing has been updated and resubmitted for approval."
              : "Your listing changes have been saved."
          );


          window.location.href =
            "/my-submissions#marketplace";

          return;

        }


        /* CREATE */

        await addDoc(
          collection(
            db,
            "marketplaceListings"
          ),
          {
            title,
            category,
            description,
            price,
            location,
            listingImage,

            userId:
              currentUser.uid,

            userName:
              currentUserData?.fullName ||
              currentUserData?.name ||
              "TalentGoldPlus User",

            profileImage:
              currentUserData?.profileImage ||
              "",

            status:
              "pending",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()
          }
        );


        alert(
          "Your listing has been submitted for approval."
        );


        window.location.href =
          "/my-submissions#marketplace";

      } catch (error) {

        console.error(
          "Listing submission error:",
          error
        );


        alert(
          error.message ||
          "The listing could not be saved."
        );

      } finally {

        if (
          submitButton
        ) {

          submitButton.disabled =
            false;


          if (
            editingListingId
          ) {

            submitButton.textContent =
              "Save Changes";

          } else {

            submitButton.textContent =
              "Submit Listing";

          }

        }

      }

    }
  );

}


/* =========================
   LOAD MARKETPLACE
========================= */

async function loadMarketplaceListings() {

  marketplaceGrid.innerHTML =
    "<p>Loading listings...</p>";


  const listingsQuery =
    query(
      collection(
        db,
        "marketplaceListings"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  const snapshot =
    await getDocs(
      listingsQuery
    );


  allListings =
    [];


  snapshot.forEach(
    (listingDoc) => {

      const listing =
        listingDoc.data();


      if (
        listing.status !==
        "approved"
      ) {

        return;

      }


      allListings.push({
        id:
          listingDoc.id,

        ...listing
      });

    }
  );


  renderMarketplaceListings(
    allListings
  );

}


/* =========================
   RENDER
========================= */

function renderMarketplaceListings(
  listings
) {

  marketplaceGrid.innerHTML =
    "";


  if (
    !listings.length
  ) {

    marketplaceGrid.innerHTML = `
      <div class="empty-state">

        <h2>
          No Listings Found
        </h2>

        <p>
          No marketplace listings match your search or selected category.
        </p>

        <a
          href="/create-listing"
          class="btn-primary"
        >
          Create a Listing
        </a>

      </div>
    `;

    return;

  }


  listings.forEach(
    (listing) => {

      const image =
        listing.listingImage &&
        listing.listingImage.startsWith(
          "http"
        )
          ? listing.listingImage
          : "";


      const card =
        document.createElement(
          "div"
        );


      card.classList.add(
        "marketplace-card"
      );


      card.innerHTML = `

        ${
          image
            ? `
              <img
                src="${image}"
                alt="${escapeHtml(listing.title)}"
                class="marketplace-card-image"
                onerror="this.style.display='none'"
              >
            `
            : ""
        }

        <div class="marketplace-card-body">

          <span class="marketplace-category">
            ${formatCategory(
              listing.category
            )}
          </span>

          <h3>
            ${escapeHtml(
              listing.title
            )}
          </h3>

          <p class="marketplace-description">
            ${escapeHtml(
              listing.description
            )}
          </p>

          <div class="marketplace-meta">

            <span>
              ${escapeHtml(
                listing.price ||
                "Price on request"
              )}
            </span>

            <span>
              ${escapeHtml(
                listing.location ||
                "Online"
              )}
            </span>

          </div>

          <p class="marketplace-provider">

            <strong>
              Provider:
            </strong>

            ${escapeHtml(
              listing.userName ||
              "TalentGoldPlus User"
            )}

          </p>

          ${
            currentUser
              ? `
                <a
                  href="/messages?to=${listing.userId}"
                  class="btn-primary marketplace-btn"
                >
                  Contact Provider
                </a>
              `
              : `
                <a
                  href="/login"
                  class="btn-primary marketplace-btn"
                >
                  Login To Contact
                </a>
              `
          }

        </div>
      `;


      marketplaceGrid.appendChild(
        card
      );

    }
  );

}


/* =========================
   FILTERS
========================= */

function applyMarketplaceFilters() {

  const searchTerm =
    marketplaceSearch
      ?.value
      .toLowerCase()
      .trim() ||
    "";


  const selectedCategory =
    marketplaceCategoryFilter
      ?.value ||
    "all";


  const filtered =
    allListings.filter(
      (listing) => {

        const matchesSearch =
          listing.title
            ?.toLowerCase()
            .includes(
              searchTerm
            ) ||

          listing.description
            ?.toLowerCase()
            .includes(
              searchTerm
            ) ||

          listing.location
            ?.toLowerCase()
            .includes(
              searchTerm
            ) ||

          listing.userName
            ?.toLowerCase()
            .includes(
              searchTerm
            );


        const listingCategory =
          normaliseCategory(
            listing.category
          );


        const selected =
          normaliseCategory(
            selectedCategory
          );


        const matchesCategory =
          selected === "all" ||

          listingCategory ===
            selected ||

          (
            selected ===
              "products" &&

            listingCategory ===
              "equipment"
          );


        return (
          matchesSearch &&
          matchesCategory
        );

      }
    );


  renderMarketplaceListings(
    filtered
  );

}


if (
  marketplaceSearch
) {

  marketplaceSearch.addEventListener(
    "input",
    applyMarketplaceFilters
  );

}


if (
  marketplaceCategoryFilter
) {

  marketplaceCategoryFilter.addEventListener(
    "change",
    applyMarketplaceFilters
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


function normaliseCategory(
  category
) {

  return (
    category ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

}


function formatCategory(
  category
) {

  if (
    !category
  ) {

    return "General";

  }


  if (
    normaliseCategory(
      category
    ) === "equipment"
  ) {

    return "Products";

  }


  return category
    .split("-")
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");

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

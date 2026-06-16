import { auth, db, storage } from "./firebase.js";

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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const listingForm = document.getElementById("listingForm");
const marketplaceGrid = document.getElementById("marketplaceGrid");
const marketplaceSearch = document.getElementById("marketplaceSearch");
const marketplaceCategoryFilter = document.getElementById("marketplaceCategoryFilter");

let currentUser = null;
let currentUserData = null;
let allListings = [];

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (user) {
    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (userSnap.exists()) {
      currentUserData = userSnap.data();
    }
  }

  if (marketplaceGrid) {
    await loadMarketplaceListings();
  }
});

/* CREATE LISTING */

if (listingForm) {
  listingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please login before creating a listing.");
      return;
    }

    const title = document.getElementById("listingTitle").value.trim();
    const category = document.getElementById("listingCategory").value;
    const description = document.getElementById("listingDescription").value.trim();
    const price = document.getElementById("listingPrice").value.trim();
    const location = document.getElementById("listingLocation").value.trim();
    const imageFile = document.getElementById("listingImage")?.files[0];

    let listingImage = "";

    if (imageFile) {
      const safeFileName = imageFile.name.replaceAll(" ", "-");

      const imageRef = ref(
        storage,
        `marketplaceListings/${currentUser.uid}/${Date.now()}-${safeFileName}`
      );

      await uploadBytes(imageRef, imageFile);
      listingImage = await getDownloadURL(imageRef);
    }

    await addDoc(collection(db, "marketplaceListings"), {
      title,
      category,
      description,
      price,
      location,
      listingImage,

      userId: currentUser.uid,

      userName:
        currentUserData?.fullName ||
        currentUserData?.name ||
        "TalentGoldPlus User",

      profileImage:
        currentUserData?.profileImage ||
        "",

      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Listing created successfully.");
    window.location.href = "marketplace.html";
  });
}

/* LOAD MARKETPLACE */

async function loadMarketplaceListings() {
  marketplaceGrid.innerHTML = "<p>Loading listings...</p>";

  const listingsQuery = query(
    collection(db, "marketplaceListings"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(listingsQuery);

  allListings = [];

  snapshot.forEach((listingDoc) => {
    const listing = listingDoc.data();

    if (listing.status !== "approved") return;

    allListings.push({
      id: listingDoc.id,
      ...listing
    });
  });

  renderMarketplaceListings(allListings);
}

/* RENDER */

function renderMarketplaceListings(listings) {
  marketplaceGrid.innerHTML = "";

  if (!listings.length) {
    marketplaceGrid.innerHTML = "<p>No marketplace listings found.</p>";
    return;
  }

  listings.forEach((listing) => {
    const image =
      listing.listingImage &&
      listing.listingImage.startsWith("http")
        ? listing.listingImage
        : "";

    const card = document.createElement("div");
    card.classList.add("marketplace-card");

    card.innerHTML = `

  ${
    image
      ? `
        <img
          src="${image}"
          alt="${listing.title}"
          class="marketplace-card-image"
          onerror="this.style.display='none'"
        >
      `
      : ""
  }

  <div class="marketplace-card-body">

    <span class="marketplace-category">
      ${formatCategory(listing.category)}
    </span>

    <h3>${listing.title}</h3>

    <p class="marketplace-description">
      ${listing.description}
    </p>

    <div class="marketplace-meta">
      <span>${listing.price || "Price on request"}</span>
      <span>${listing.location || "Online"}</span>
    </div>

    <p class="marketplace-provider">
      <strong>Provider:</strong>
      ${listing.userName || "TalentGoldPlus User"}
    </p>

    ${
      currentUser
        ? `
          <a href="messages.html" class="btn-primary marketplace-btn">
            Contact Provider
          </a>
        `
        : `
          <a href="../auth/login.html" class="btn-primary marketplace-btn">
            Login To Contact
          </a>
        `
    }

  </div>

`;

    marketplaceGrid.appendChild(card);
  });
}

/* SEARCH AND FILTER */

function applyMarketplaceFilters() {
  const searchTerm =
    marketplaceSearch?.value.toLowerCase().trim() || "";

  const selectedCategory =
    marketplaceCategoryFilter?.value || "all";

  const filtered = allListings.filter((listing) => {
    const matchesSearch =
      listing.title?.toLowerCase().includes(searchTerm) ||
      listing.description?.toLowerCase().includes(searchTerm) ||
      listing.location?.toLowerCase().includes(searchTerm) ||
      listing.userName?.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" ||
      listing.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  renderMarketplaceListings(filtered);
}

if (marketplaceSearch) {
  marketplaceSearch.addEventListener("input", applyMarketplaceFilters);
}

if (marketplaceCategoryFilter) {
  marketplaceCategoryFilter.addEventListener("change", applyMarketplaceFilters);
}

/* HELPERS */

function formatCategory(category) {
  if (!category) return "General";

  return category
    .split("-")
    .map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}
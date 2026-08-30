import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const mediaForm = document.getElementById("mediaForm");
const mediaGrid = document.getElementById("mediaGrid");
const mediaType = document.getElementById("mediaType");
const fileUploadGroup = document.getElementById("fileUploadGroup");
const videoLinkGroup = document.getElementById("videoLinkGroup");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "/login";
    return;
  }

  currentUser = user;

  await loadMyMedia();

});

if (mediaType) {

  mediaType.addEventListener("change", () => {

    if (mediaType.value === "video-link") {
      fileUploadGroup.style.display = "none";
      videoLinkGroup.style.display = "block";
    } else {
      fileUploadGroup.style.display = "block";
      videoLinkGroup.style.display = "none";
    }

  });

}

if (mediaForm) {

  mediaForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const title = document.getElementById("mediaTitle").value.trim();
    const type = document.getElementById("mediaType").value;
    const description = document.getElementById("mediaDescription").value.trim();
    const mediaFile = document.getElementById("mediaFile")?.files[0];
    const videoUrl = document.getElementById("videoUrl")?.value.trim();

    if (!title || !type) {
      alert("Please add a title and media type.");
      return;
    }

    let mediaUrl = "";

    if (type === "video-link") {

      if (!videoUrl) {
        alert("Please add a video link.");
        return;
      }

      mediaUrl = videoUrl;

    } else {

      if (!mediaFile) {
        alert("Please upload an image.");
        return;
      }

      const safeFileName =
        mediaFile.name.replaceAll(" ", "-");

      const mediaRef =
        ref(
          storage,
          `userMedia/${currentUser.uid}/${Date.now()}-${safeFileName}`
        );

      await uploadBytes(mediaRef, mediaFile);

      mediaUrl =
        await getDownloadURL(mediaRef);

    }

    await addDoc(
      collection(db, "userMedia"),
      {
        userId: currentUser.uid,
        title,
        type,
        description,
        mediaUrl,
        createdAt: serverTimestamp()
      }
    );

    alert("Media saved successfully.");

    mediaForm.reset();

    fileUploadGroup.style.display = "block";
    videoLinkGroup.style.display = "none";

    await loadMyMedia();

  });

}

async function loadMyMedia() {

  mediaGrid.innerHTML =
    "<p>Loading media...</p>";

  const mediaQuery =
    query(
      collection(db, "userMedia"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

  const snapshot =
    await getDocs(mediaQuery);

  mediaGrid.innerHTML = "";

  if (snapshot.empty) {
    mediaGrid.innerHTML =
      "<p>No media uploaded yet.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {

    const item =
      docSnap.data();

    const card =
      document.createElement("div");

    card.classList.add("media-card");

    card.innerHTML = `
      ${
        item.type === "video-link"
          ? `
            <div class="media-video-placeholder">
              🎥
            </div>
          `
          : `
            <img
              src="${item.mediaUrl}"
              alt="${item.title}"
              onerror="this.src='../assets/images/avatar-placeholder.png'"
            >
          `
      }

      <div class="media-card-body">
        <span>${formatText(item.type)}</span>
        <h3>${item.title}</h3>
        <p>${item.description || "No description added."}</p>

        ${
          item.type === "video-link"
            ? `
              <a href="${item.mediaUrl}" target="_blank" class="btn-secondary">
                Watch Video
              </a>
            `
            : ""
        }
      </div>
    `;

    mediaGrid.appendChild(card);

  });

}

function formatText(value) {
  return (value || "")
    .toString()
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

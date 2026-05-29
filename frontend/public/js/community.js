import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const postForm = document.getElementById("communityPostForm");
const postText = document.getElementById("postText");
const postMedia = document.getElementById("postMedia");
const chooseMediaBtn = document.getElementById("chooseMediaBtn");
const selectedMediaName = document.getElementById("selectedMediaName");
const communityFeed = document.getElementById("communityFeed");
const postUserImage = document.getElementById("postUserImage");

let currentUser = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  currentUser = user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    currentUserData = userSnap.data();

    if (postUserImage) {
      postUserImage.src =
        currentUserData.profileImage ||
        "../assets/images/default-profile.png";
    }
  }

  loadCommunityPosts();
});

if (chooseMediaBtn && postMedia) {
  chooseMediaBtn.addEventListener("click", () => {
    postMedia.click();
  });
}

if (postMedia) {
  postMedia.addEventListener("change", () => {
    const file = postMedia.files[0];

    if (file && selectedMediaName) {
      selectedMediaName.textContent = file.name;
    }
  });
}

if (postForm) {
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = postText.value.trim();
    const file = postMedia.files[0];

    if (!text && !file) {
      alert("Please write something or choose a photo/video.");
      return;
    }

    try {
      let mediaUrl = "";
      let mediaType = "";

      if (file) {
        const safeFileName = file.name.replaceAll(" ", "-");

        const mediaRef = ref(
          storage,
          `communityPosts/${currentUser.uid}/${Date.now()}-${safeFileName}`
        );

        await uploadBytes(mediaRef, file);

        mediaUrl = await getDownloadURL(mediaRef);

        mediaType = file.type.startsWith("video")
          ? "video"
          : "image";
      }

      await addDoc(collection(db, "communityPosts"), {
        userId: currentUser.uid,
        name:
          currentUserData?.fullName ||
          currentUserData?.name ||
          "TalentGoldPlus User",
        role: currentUserData?.role || "Member",
        profileImage: currentUserData?.profileImage || "",
        text,
        mediaUrl,
        mediaType,
        likes: [],
        createdAt: serverTimestamp()
      });

      postText.value = "";
      postMedia.value = "";

      if (selectedMediaName) {
        selectedMediaName.textContent = "";
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

function loadCommunityPosts() {
  const postsRef = collection(db, "communityPosts");

  const q = query(postsRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    communityFeed.innerHTML = "";

    if (snapshot.empty) {
      communityFeed.innerHTML =
        "<p>No posts yet. Be the first to share an update.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;

      const likes = post.likes || [];
      const hasLiked = likes.includes(currentUser.uid);

      const article = document.createElement("article");
      article.classList.add("feed-card");

      const mediaHtml = post.mediaUrl
        ? post.mediaType === "video"
          ? `<video class="feed-image" controls src="${post.mediaUrl}"></video>`
          : `<img class="feed-image" src="${post.mediaUrl}" alt="Post media">`
        : "";

      article.innerHTML = `
        <div class="feed-header">
          <img
            src="${post.profileImage || "../assets/images/default-profile.png"}"
            alt="${post.name}"
          >

          <div>
            <h3>${post.name}</h3>
            <p>${post.role} • Just now</p>
          </div>
        </div>

        <p class="feed-text">
          ${post.text || ""}
        </p>

        ${mediaHtml}

        <div class="feed-actions">
          <button
            type="button"
            class="feed-action-btn like-btn ${hasLiked ? "liked" : ""}"
            data-post-id="${postId}"
            data-liked="${hasLiked}"
          >
            ❤️ ${hasLiked ? "Liked" : "Like"} (${likes.length})
          </button>

          <button
            type="button"
            class="feed-action-btn comment-toggle-btn"
            data-post-id="${postId}"
          >
            💬 Comment
          </button>

          <button type="button" class="feed-action-btn">
            ↗️ Share
          </button>
        </div>

        <div class="comments-section" id="comments-${postId}">
          <div class="comments-list"></div>

          <form class="comment-form" data-post-id="${postId}">
            <input
              type="text"
              placeholder="Write a comment..."
              required
            >
            <button type="submit">
              Post
            </button>
          </form>
        </div>
      `;

      communityFeed.appendChild(article);
    });

    document.querySelectorAll(".like-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.postId;
        const liked = button.dataset.liked === "true";

        const postRef = doc(db, "communityPosts", postId);

        if (liked) {
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid)
          });
        } else {
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser.uid)
          });
        }
      });
    });

    document.querySelectorAll(".comment-form").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const postId = form.dataset.postId;
        const input = form.querySelector("input");
        const comment = input.value.trim();

        if (!comment) return;

        await addDoc(
          collection(db, "communityPosts", postId, "comments"),
          {
            userId: currentUser.uid,
            name:
              currentUserData?.fullName ||
              currentUserData?.name ||
              "User",
            profileImage:
              currentUserData?.profileImage ||
              "",
            comment,
            createdAt: serverTimestamp()
          }
        );

        input.value = "";

        loadComments(postId);
      });
    });

    document.querySelectorAll(".comment-toggle-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const postId = button.dataset.postId;
        await loadComments(postId);
      });
    });
  });
}

async function loadComments(postId) {
  const commentsContainer =
    document.querySelector(`#comments-${postId} .comments-list`);

  if (!commentsContainer) return;

  const commentsRef =
    collection(db, "communityPosts", postId, "comments");

  const commentsQuery =
    query(commentsRef, orderBy("createdAt", "asc"));

  const commentsSnapshot =
    await getDocs(commentsQuery);

  commentsContainer.innerHTML = "";

  if (commentsSnapshot.empty) {
    commentsContainer.innerHTML =
      "<p class='no-comments'>No comments yet.</p>";
    return;
  }

  commentsSnapshot.forEach((commentDoc) => {
    const comment = commentDoc.data();

    commentsContainer.innerHTML += `
      <div class="comment-item">
        <strong>${comment.name}</strong>
        <p>${comment.comment}</p>
      </div>
    `;
  });
}
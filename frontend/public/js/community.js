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
let unsubscribePosts = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  currentUser = user;

  const userSnap = await getDoc(doc(db, "users", user.uid));

  if (userSnap.exists()) {
    currentUserData = userSnap.data();

    if (postUserImage) {
      postUserImage.src =
        currentUserData.profileImage &&
        currentUserData.profileImage.startsWith("http")
          ? currentUserData.profileImage
          : "../assets/images/avatar-placeholder.png";
    }
  }

  loadCommunityPosts();
});

document.addEventListener("click", async (e) => {
  const button = e.target.closest(".report-post-btn");

  if (!button) return;

  const postId = button.dataset.postId;

  const reason = prompt("Why are you reporting this post?");

  if (!reason) return;

  try {
    await addDoc(
      collection(db, "reports"),
      {
        type: "community_post",
        itemId: postId,
        reportedPostText: button.dataset.postText || "",
        reportedPostMedia: button.dataset.postMedia || "",
        reportedPostAuthor: button.dataset.postAuthor || "",
        reportedBy: currentUser.uid,
        reportedByName:
          currentUserData?.fullName ||
          currentUserData?.name ||
          "Unknown User",
        reason,
        status: "open",
        createdAt: serverTimestamp()
      }
    );

    alert("Report submitted. Thank you.");
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

document.addEventListener("click", async (e) => {

  const button = e.target.closest(".share-post-btn");

  if (!button) return;

  const postId =
    button.dataset.postId;

  const postText =
    button.dataset.postText || "";

  const shareUrl =
    `${window.location.origin}${window.location.pathname}?post=${postId}`;

  const shareData = {
    title: "TalentGoldPlus Community Post",
    text: postText || "Check out this TalentGoldPlus community post.",
    url: shareUrl
  };

  try {

    if (navigator.share) {

      await navigator.share(shareData);

      return;
    }

    await navigator.clipboard.writeText(shareUrl);

    alert("Post link copied to clipboard.");

  } catch (error) {

    console.error(error);

    await navigator.clipboard.writeText(shareUrl);

    alert("Post link copied to clipboard.");

  }

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
        hidden: false,
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
  if (unsubscribePosts) {
    unsubscribePosts();
  }

  const q = query(
    collection(db, "communityPosts"),
    orderBy("createdAt", "desc")
  );

  unsubscribePosts = onSnapshot(q, (snapshot) => {
    communityFeed.innerHTML = "";

    if (snapshot.empty) {
      communityFeed.innerHTML =
        "<p>No posts yet. Be the first to share an update.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;

      if (post.hidden === true) {
        return;
      }

      const likes = post.likes || [];
      const hasLiked = likes.includes(currentUser.uid);

      const profileImage =
        post.profileImage &&
        post.profileImage.startsWith("http")
          ? post.profileImage
          : "../assets/images/avatar-placeholder.png";

      const mediaHtml = post.mediaUrl
        ? post.mediaType === "video"
          ? `<video class="feed-image" controls src="${post.mediaUrl}"></video>`
          : `<img class="feed-image" src="${post.mediaUrl}" alt="Post media">`
        : "";

      const article = document.createElement("article");
      article.classList.add("feed-card");

      article.innerHTML = `
        <div class="feed-header">
          <img
            src="${profileImage}"
            alt="${post.name || "User"}"
            onerror="this.src='../assets/images/avatar-placeholder.png'"
          >

          <div>
            <h3>${post.name || "TalentGoldPlus User"}</h3>
            <p>${post.role || "Member"} • Just now</p>
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

          <button
            type="button"
            class="feed-action-btn share-post-btn"
            data-post-id="${postId}"
            data-post-text="${post.text || ""}"
          >
            ↗️ Share
          </button>

          <button
            type="button"
            class="feed-action-btn report-post-btn"
            data-post-id="${postId}"
            data-post-text="${post.text || ""}"
            data-post-author="${post.name || ""}"
            data-post-media="${post.mediaUrl || ""}"
          >
            🚩 Report
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

    attachPostEvents();
  });
}

function attachPostEvents() {
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
          profileImage: currentUserData?.profileImage || "",
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
}

async function loadComments(postId) {
  const commentsContainer =
    document.querySelector(`#comments-${postId} .comments-list`);

  if (!commentsContainer) return;

  const commentsQuery =
    query(
      collection(db, "communityPosts", postId, "comments"),
      orderBy("createdAt", "asc")
    );

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
        <strong>${comment.name || "User"}</strong>
        <p>${comment.comment}</p>
      </div>
    `;
  });
}
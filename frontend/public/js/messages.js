import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const conversationList = document.getElementById("conversationList");
const chatHeader = document.getElementById("chatHeader");
const messagesList = document.getElementById("messagesList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const newChatBtn = document.getElementById("newChatBtn");

const newChatSearch = document.getElementById("newChatSearch");
const userSearchInput = document.getElementById("userSearchInput");
const userSearchResults = document.getElementById("userSearchResults");

let currentUser = null;
let activeConversationId = null;
let activeConversationData = null;
let unsubscribeMessages = null;
let unsubscribeConversations = null;
let allUsers = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  currentUser = user;

  await loadUsersForSearch();
  await loadConversations();

  const params = new URLSearchParams(window.location.search);
  const conversationId = params.get("conversation");
  const targetUserId = params.get("to");

  if (conversationId) {
    await openConversationFromUrl(conversationId);
  } else if (targetUserId) {
    await startConversationWithUser(targetUserId);
  }
});

async function loadUsersForSearch() {
  const snapshot = await getDocs(collection(db, "users"));

  allUsers = [];

  snapshot.forEach((userDoc) => {
    if (userDoc.id === currentUser.uid) return;

    allUsers.push({
      id: userDoc.id,
      ...userDoc.data()
    });
  });
}

async function loadConversations() {
  conversationList.innerHTML = "<p>Loading conversations...</p>";

  const conversationsQuery = query(
    collection(db, "conversations"),
    where("participants", "array-contains", currentUser.uid)
  );

  if (unsubscribeConversations) {
    unsubscribeConversations();
  }

  unsubscribeConversations = onSnapshot(conversationsQuery, async (snapshot) => {
    conversationList.innerHTML = "";

    if (snapshot.empty) {
      conversationList.innerHTML = "<p>No conversations yet.</p>";
      return;
    }

    for (const conversationDoc of snapshot.docs) {
      const conversation = conversationDoc.data();

      const otherUserId = conversation.participants.find(
        (id) => id !== currentUser.uid
      );

      const otherUser = await getUserData(otherUserId);

      const item = document.createElement("div");
      item.classList.add("conversation-item");

      if (conversationDoc.id === activeConversationId) {
        item.classList.add("active");
      }

      item.dataset.conversationId = conversationDoc.id;

      item.innerHTML = `
        <img
          src="${getProfileImage(otherUser)}"
          alt="${getDisplayName(otherUser)}"
          onerror="this.src='../assets/images/avatar-placeholder.png'"
        >

        <div>
          <h3>${getDisplayName(otherUser)}</h3>
          <p>${conversation.lastMessage || "No messages yet."}</p>
        </div>
      `;

      item.addEventListener("click", () => {
        openConversation(conversationDoc.id, otherUser);

        window.history.replaceState(
          null,
          "",
          `messages.html?conversation=${conversationDoc.id}`
        );
      });

      conversationList.appendChild(item);
    }
  });
}

async function openConversationFromUrl(conversationId) {
  const conversationRef = doc(db, "conversations", conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    chatHeader.innerHTML = `
      <h2>Conversation not found</h2>
      <p>This conversation may have been deleted.</p>
    `;
    return;
  }

  const conversation = conversationSnap.data();

  if (
    !conversation.participants ||
    !conversation.participants.includes(currentUser.uid)
  ) {
    chatHeader.innerHTML = `
      <h2>Access denied</h2>
      <p>You are not part of this conversation.</p>
    `;
    return;
  }

  const otherUserId = conversation.participants.find(
    (id) => id !== currentUser.uid
  );

  const otherUser = await getUserData(otherUserId);

  openConversation(conversationId, otherUser);
}

async function startConversationWithUser(targetUserId) {
  if (!targetUserId || targetUserId === currentUser.uid) {
    return;
  }

  const conversationsQuery = query(
    collection(db, "conversations"),
    where("participants", "array-contains", currentUser.uid)
  );

  const snapshot = await getDocs(conversationsQuery);

  let existingConversationId = null;

  snapshot.forEach((conversationDoc) => {
    const conversation = conversationDoc.data();

    if (
      conversation.participants &&
      conversation.participants.includes(targetUserId)
    ) {
      existingConversationId = conversationDoc.id;
    }
  });

  const targetUser = await getUserData(targetUserId);

  if (existingConversationId) {
    openConversation(existingConversationId, targetUser);

    window.history.replaceState(
      null,
      "",
      `messages.html?conversation=${existingConversationId}`
    );

    hideNewChatSearch();

    return;
  }

  const newConversationRef = await addDoc(
    collection(db, "conversations"),
    {
      participants: [
        currentUser.uid,
        targetUserId
      ],
      lastMessage: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  );

  openConversation(newConversationRef.id, targetUser);

  window.history.replaceState(
    null,
    "",
    `messages.html?conversation=${newConversationRef.id}`
  );

  hideNewChatSearch();
}

async function openConversation(conversationId, otherUser) {
  activeConversationId = conversationId;

  const conversationSnap = await getDoc(
    doc(db, "conversations", conversationId)
  );

  activeConversationData = conversationSnap.exists()
    ? conversationSnap.data()
    : null;

  document.querySelectorAll(".conversation-item")
    .forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.conversationId === conversationId
      );
    });

  chatHeader.innerHTML = `
    <div class="chat-user-header">
      <img
        src="${getProfileImage(otherUser)}"
        alt="${getDisplayName(otherUser)}"
        onerror="this.src='../assets/images/avatar-placeholder.png'"
      >

      <div>
        <h2>${getDisplayName(otherUser)}</h2>
        <p>${formatUserRole(otherUser)}</p>
      </div>
    </div>
  `;

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  const messagesQuery = query(
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    ),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    messagesList.innerHTML = "";

    if (snapshot.empty) {
      messagesList.innerHTML =
        "<p class='empty-chat'>No messages yet. Start the conversation.</p>";
      return;
    }

    snapshot.forEach((messageDoc) => {
      const message = messageDoc.data();

      const bubble = document.createElement("div");
      bubble.classList.add("message-bubble");

      if (message.senderId === currentUser.uid) {
        bubble.classList.add("sent");
      } else {
        bubble.classList.add("received");
      }

      bubble.textContent = message.text || "";

      messagesList.appendChild(bubble);
    });

    messagesList.scrollTop = messagesList.scrollHeight;
  });
}

if (messageForm) {
  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();

    if (!text) return;

    if (!activeConversationId) {
      alert("Please select a conversation first.");
      return;
    }

    await addDoc(
      collection(
        db,
        "conversations",
        activeConversationId,
        "messages"
      ),
      {
        senderId: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      }
    );

    await updateDoc(
      doc(db, "conversations", activeConversationId),
      {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }
    );

    const receiverId =
      activeConversationData?.participants?.find(
        (id) => id !== currentUser.uid
      );

    if (receiverId) {
      await addDoc(
        collection(db, "notifications"),
        {
          userId: receiverId,
          type: "new_message",
          message: "You have a new message.",
          conversationId: activeConversationId,
          senderId: currentUser.uid,
          read: false,
          createdAt: serverTimestamp()
        }
      );
    }

    messageInput.value = "";
  });
}

if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    if (!newChatSearch) return;

    newChatSearch.style.display =
      newChatSearch.style.display === "none"
        ? "block"
        : "none";

    if (userSearchInput) {
      userSearchInput.focus();
    }

    if (userSearchResults) {
      userSearchResults.innerHTML = "";
    }
  });
}

if (userSearchInput) {
  userSearchInput.addEventListener("input", () => {
    const searchTerm =
      userSearchInput.value.toLowerCase().trim();

    if (!searchTerm) {
      userSearchResults.innerHTML = "";
      return;
    }

    const results = allUsers.filter((user) => {
      const name = normalise(user.fullName || user.name);
      const email = normalise(user.email);
      const role = normalise(user.role);
      const sport = normalise(user.sport || user.category);
      const professionalCategory = normalise(user.professionalCategory);
      const location = normalise(user.location);

      return (
        name.includes(searchTerm) ||
        email.includes(searchTerm) ||
        role.includes(searchTerm) ||
        sport.includes(searchTerm) ||
        professionalCategory.includes(searchTerm) ||
        location.includes(searchTerm)
      );
    });

    renderUserSearchResults(results);
  });
}

function renderUserSearchResults(users) {
  userSearchResults.innerHTML = "";

  if (!users.length) {
    userSearchResults.innerHTML =
      "<p class='empty-chat'>No members found.</p>";
    return;
  }

  users.slice(0, 10).forEach((user) => {
    const item = document.createElement("div");
    item.classList.add("user-search-result");

    item.innerHTML = `
      <img
        src="${getProfileImage(user)}"
        alt="${getDisplayName(user)}"
        onerror="this.src='../assets/images/avatar-placeholder.png'"
      >

      <div>
        <h3>${getDisplayName(user)}</h3>
        <p>${formatUserRole(user)}</p>
        <small>${user.location || "Location not set"}</small>
      </div>

      <button class="btn-primary start-chat-btn">
        Start Chat
      </button>
    `;

    item
      .querySelector(".start-chat-btn")
      .addEventListener("click", async () => {
        await startConversationWithUser(user.id);
      });

    userSearchResults.appendChild(item);
  });
}

function hideNewChatSearch() {
  if (newChatSearch) {
    newChatSearch.style.display = "none";
  }

  if (userSearchInput) {
    userSearchInput.value = "";
  }

  if (userSearchResults) {
    userSearchResults.innerHTML = "";
  }
}

async function getUserData(userId) {
  if (!userId) {
    return {
      name: "Unknown User",
      role: "Member",
      profileImage: ""
    };
  }

  const userSnap = await getDoc(
    doc(db, "users", userId)
  );

  if (!userSnap.exists()) {
    return {
      name: "Unknown User",
      role: "Member",
      profileImage: ""
    };
  }

  return {
    id: userId,
    ...userSnap.data()
  };
}

function getDisplayName(userData) {
  return (
    userData.fullName ||
    userData.name ||
    "TalentGoldPlus User"
  );
}

function getProfileImage(userData) {
  return (
    userData.profileImage &&
    userData.profileImage.startsWith("http")
  )
    ? userData.profileImage
    : "../assets/images/avatar-placeholder.png";
}

function formatUserRole(userData) {
  if (userData.professionalCategory) {
    return formatText(userData.professionalCategory);
  }

  if (userData.sport || userData.category) {
    return `${formatText(userData.role || "Member")} • ${formatText(userData.sport || userData.category)}`;
  }

  return formatText(userData.role || "Member");
}

function normalise(value) {
  return (value || "")
    .toString()
    .replaceAll("-", " ")
    .trim()
    .toLowerCase();
}

function formatText(value) {
  return (value || "")
    .toString()
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
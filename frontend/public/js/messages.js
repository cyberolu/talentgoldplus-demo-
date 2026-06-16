import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const conversationList =
  document.getElementById("conversationList");

const chatHeader =
  document.getElementById("chatHeader");

const messagesList =
  document.getElementById("messagesList");

const messageForm =
  document.getElementById("messageForm");

const messageInput =
  document.getElementById("messageInput");

const newChatBtn =
  document.getElementById("newChatBtn");

let currentUser = null;
let activeConversationId = null;
let unsubscribeMessages = null;
let unsubscribeConversations = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  currentUser = user;

  await loadConversations();

  const params =
    new URLSearchParams(window.location.search);

  const conversationId =
    params.get("conversation");

  if (conversationId) {
    await openConversationFromUrl(conversationId);
  }

});

async function loadConversations() {

  conversationList.innerHTML =
    "<p>Loading conversations...</p>";

    const conversationsQuery =
    query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid)
    );

  if (unsubscribeConversations) {
    unsubscribeConversations();
  }

  unsubscribeConversations =
    onSnapshot(conversationsQuery, async (snapshot) => {

      conversationList.innerHTML = "";

      if (snapshot.empty) {
        conversationList.innerHTML =
          "<p>No conversations yet.</p>";
        return;
      }

      for (const conversationDoc of snapshot.docs) {

        const conversation =
          conversationDoc.data();

        const otherUserId =
          conversation.participants.find(
            (id) => id !== currentUser.uid
          );

        const otherUser =
          await getUserData(otherUserId);

        const item =
          document.createElement("div");

        item.classList.add("conversation-item");

        if (conversationDoc.id === activeConversationId) {
          item.classList.add("active");
        }

        item.dataset.conversationId =
          conversationDoc.id;

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
          openConversation(
            conversationDoc.id,
            otherUser
          );

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

  const conversationRef =
    doc(db, "conversations", conversationId);

  const conversationSnap =
    await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    chatHeader.innerHTML = `
      <h2>Conversation not found</h2>
      <p>This conversation may have been deleted.</p>
    `;
    return;
  }

  const conversation =
    conversationSnap.data();

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

  const otherUserId =
    conversation.participants.find(
      (id) => id !== currentUser.uid
    );

  const otherUser =
    await getUserData(otherUserId);

  openConversation(
    conversationId,
    otherUser
  );

}

async function openConversation(conversationId, otherUser) {

  activeConversationId =
    conversationId;

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
        <p>${otherUser.role || "Member"}</p>
      </div>
    </div>
  `;

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  const messagesQuery =
    query(
      collection(
        db,
        "conversations",
        conversationId,
        "messages"
      ),
      orderBy("createdAt", "asc")
    );

  unsubscribeMessages =
    onSnapshot(messagesQuery, (snapshot) => {

      messagesList.innerHTML = "";

      if (snapshot.empty) {
        messagesList.innerHTML =
          "<p class='empty-chat'>No messages yet. Start the conversation.</p>";
        return;
      }

      snapshot.forEach((messageDoc) => {

        const message =
          messageDoc.data();

        const bubble =
          document.createElement("div");

        bubble.classList.add("message-bubble");

        if (message.senderId === currentUser.uid) {
          bubble.classList.add("sent");
        } else {
          bubble.classList.add("received");
        }

        bubble.textContent =
          message.text || "";

        messagesList.appendChild(bubble);

      });

      messagesList.scrollTop =
        messagesList.scrollHeight;

    });

}

if (messageForm) {

  messageForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const text =
      messageInput.value.trim();

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

    messageInput.value = "";

  });

}

if (newChatBtn) {

  newChatBtn.addEventListener("click", async () => {

    alert(
      "For now, start chats from Connections or Marketplace. New Chat search will be added later."
    );

  });

}

async function getUserData(userId) {

  if (!userId) {
    return {
      name: "Unknown User",
      role: "Member",
      profileImage: ""
    };
  }

  const userSnap =
    await getDoc(
      doc(db, "users", userId)
    );

  if (!userSnap.exists()) {
    return {
      name: "Unknown User",
      role: "Member",
      profileImage: ""
    };
  }

  return userSnap.data();

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
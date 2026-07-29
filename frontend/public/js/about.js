const readMoreButtons =
  document.querySelectorAll(".leader-read-more");

readMoreButtons.forEach((button) => {

  button.addEventListener("click", () => {

    const leaderBio =
      button.closest(".leader-bio");

    const hiddenContent =
      leaderBio?.querySelector(".leader-bio-more");

    if (!hiddenContent) return;

    const isOpen =
      hiddenContent.classList.toggle("is-open");

    button.textContent =
      isOpen
        ? "Read Less"
        : "Read More";

    button.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

  });

});
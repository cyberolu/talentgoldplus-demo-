const athletes = {
    1: {
      name: "Rose Collings",
      sport: "Sprint Athlete",
      location: "U15 | United Kingdom",
      extra: "100m: 11.51s",
      image: "../assets/images/athlete1.jpg"
    },
    2: {
      name: "Lana Smith",
      sport: "Football",
      location: "U18 | London",
      extra: "Forward",
      image: "../assets/images/athlete2.jpg"
    },
    3: {
      name: "Sarah Johnson",
      sport: "Basketball",
      location: "U17 | Manchester",
      extra: "Guard",
      image: "../assets/images/athlete3.jpg"
    }
  };
  
  // Get ID from URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  
  const athlete = athletes[id];
  
  if (athlete) {
    document.getElementById("name").textContent = athlete.name;
    document.getElementById("sport").textContent = athlete.sport;
    document.getElementById("location").textContent = athlete.location;
    document.getElementById("extra").textContent = athlete.extra;
    document.getElementById("profile-image").src = athlete.image;
  }
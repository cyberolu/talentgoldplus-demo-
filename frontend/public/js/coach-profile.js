const coaches = {
    1: {
      name: "James Carter",
      sport: "Sprint Coach",
      location: "London | United Kingdom",
      extra: "10+ Years Experience",
      image: "../assets/images/coach1.jpg",
      bio: "Experienced sprint coach specialising in speed development, athlete progression and elite performance preparation."
    },
  
    2: {
      name: "Maria Lopez",
      sport: "Football Coach",
      location: "Manchester | UK",
      extra: "UEFA Licensed",
      image: "../assets/images/coach2.jpg",
      bio: "Dedicated football coach focused on technical development, tactical awareness and youth progression pathways."
    },
  
    3: {
      name: "David Brown",
      sport: "Basketball Development Coach",
      location: "Birmingham | UK",
      extra: "Elite Youth Development",
      image: "../assets/images/coach3.jpg",
      bio: "Basketball development specialist helping young athletes improve game intelligence, movement and confidence."
    }
  };
  
  const params = new URLSearchParams(window.location.search);
  
  const id = params.get("id");
  
  const coach = coaches[id];
  
  if (coach) {
    document.getElementById("name").textContent = coach.name;
    document.getElementById("sport").textContent = coach.sport;
    document.getElementById("location").textContent = coach.location;
    document.getElementById("extra").textContent = coach.extra;
    document.getElementById("profile-image").src = coach.image;
    document.getElementById("bio").textContent = coach.bio;
  }
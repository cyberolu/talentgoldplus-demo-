const ambassadors = {

    chioma: {
      image: "../assets/images/chioma1.jpeg",
      name: "Chioma Ajunwa",
      title: "Founder | Olympic Champion",
      bio: `Chioma Ajunwa is Nigeria's first Olympic gold medallist and one of Africa's most influential sporting pioneers. As Founder of TalentGoldPlus, her vision is to create opportunities, connections and pathways that help talented individuals achieve their full potential both on and off the field of play.`
    },
  
    ruth: {
      image: "../assets/images/Ruth-Ogbeifo-Balofin.jpeg",
      name: "Ruth Ogbeifo-Balofin",
      title: "Ambassador | Olympian",
      bio: `Ruth Ogbeifo-Balofin is an Olympic silver medallist and former Nigerian international weightlifter. At the 1999 World Championships she won bronze medals in the snatch, clean and jerk and overall categories. She later won Olympic silver at the Sydney 2000 Olympic Games and is now a respected physiotherapist based in London.`
    },
  
    marcus: {
      image: "../assets/images/marcus-adam.jpeg",
      name: "Marcus Adam",
      title: "Ambassador | Olympian",
      bio: `Marcus Adam represented Great Britain in both athletics and bobsleigh, becoming one of the few athletes to compete in both Summer and Winter Olympic Games. He won Commonwealth Games gold in the 200 metres and remains part of the British record holding 4x200 metres relay team.`
    },
  
    stephi: {
      image: "../assets/images/stephanie-douglas.jpeg",
      name: "Stephi Douglas",
      title: "Ambassador | Olympian",
      bio: `Stephi Douglas represented Great Britain at the 1992 and 1996 Olympic Games and earned Commonwealth relay medals for England. Beyond her achievements on the track, she has built a successful career as a physiotherapist and continues to support athletes in achieving their physical potential.`
    },
  
    glory: {
      image: "../assets/images/Glory_Alozie.jpeg",
      name: "Glory Alozie",
      title: "Ambassador | Olympian",
      bio: `Glory Alozie is one of Africa's most accomplished hurdlers. A multiple African champion and former African and Commonwealth record holder in the 100 metres hurdles, she competed at the highest level internationally and now contributes to athlete development as a coach in Europe.`
    },
  
    michael: {
      image: "../assets/images/michael-bruce.jpg",
      name: "Dr Michael Bruce",
      title: "Ambassador | Performance Expert",
      bio: `Dr Michael Bruce is a Cognitive Psychologist and elite performance specialist who has worked with top level athletes and Premiership football clubs including Arsenal and Chelsea. His work focuses on performance psychology, speed development and helping athletes unlock their full potential.`
    },
  
    olusoji: {
      image: "../assets/images/olusoji-fasuba.jpg",
      name: "Olusoji Fasuba",
      title: "Website Designer & Platform Developer",
      bio: `Olusoji Fasuba is the designer and developer behind the TalentGoldPlus platform. Drawing on experience in both sport and technology, he created the platform to help connect athletes, coaches, professionals, scouts and investors through a single ecosystem designed to create opportunities and unlock potential.`
    }
  
  };
  
  const modal =
    document.getElementById("ambassadorModal");
  
  const modalImage =
    document.getElementById("modalImage");
  
  const modalName =
    document.getElementById("modalName");
  
  const modalTitle =
    document.getElementById("modalTitle");
  
  const modalBio =
    document.getElementById("modalBio");
  
  const closeModal =
    document.getElementById("closeAmbassadorModal");
  
  document
    .querySelectorAll(".ambassador-card")
    .forEach((card) => {
  
      card.addEventListener("click", () => {
  
        const ambassadorKey =
          card.dataset.ambassador;
  
        const ambassador =
          ambassadors[ambassadorKey];
  
        if (!ambassador) return;
  
        modalImage.src =
          ambassador.image;
  
        modalImage.alt =
          ambassador.name;
  
        modalName.textContent =
          ambassador.name;
  
        modalTitle.textContent =
          ambassador.title;
  
        modalBio.textContent =
          ambassador.bio;
  
        modal.classList.add("show");
  
      });
  
    });
  
  closeModal.addEventListener("click", () => {
  
    modal.classList.remove("show");
  
  });
  
  modal.addEventListener("click", (event) => {
  
    if (event.target === modal) {
  
      modal.classList.remove("show");
  
    }
  
  });
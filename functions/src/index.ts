import {setGlobalOptions} from "firebase-functions/v2";

// Global settings for all Cloud Functions
setGlobalOptions({
  region: "europe-west2",
  maxInstances: 10,
});

// TalentGoldPlus Cloud Functions
// New backend functions will be added here as the project grows.
import {
  setGlobalOptions,
} from "firebase-functions/v2";

setGlobalOptions({
  region: "europe-west2",
  maxInstances: 10,
  cpu: "gcf_gen1",
});


/* =========================
   APPROVALS
========================= */

export {
  approveEvent,
} from "./admin/approve-event";

export {
  rejectEvent,
} from "./admin/reject-event";

export {
  approveListing,
} from "./admin/approve-listing";

export {
  rejectListing,
} from "./admin/reject-listing";

export {
  approveOpportunity,
} from "./admin/approve-opportunity";

export {
  rejectOpportunity,
} from "./admin/reject-opportunity";

export {
  approveFundraiser,
} from "./admin/approve-fundraiser";

export {
  rejectFundraiser,
} from "./admin/reject-fundraiser";


/* =========================
   USER ADMINISTRATION
========================= */

export {
  setUserRole,
} from "./admin/set-user-role";

export {
  setUserStatus,
} from "./admin/set-user-status";

export {
  approveUserAccount,
} from "./admin/approve-user-account";

export {
  rejectUserAccount,
} from "./admin/reject-user-account";

export {
  archiveApprovedContent,
} from "./admin/archive-approved-content";

export {
  processContentLifecycle,
} from "./admin/content-lifecycle";

export {
  runContentLifecycleNow,
} from "./admin/run-content-lifecycle-now";

export {
  restoreArchivedContent,
} from "./admin/restore-archived-content";


export {
  deleteArchivedContent,
} from "./admin/delete-archived-content";


export {
  rebuildArchiveIndex,
} from "./admin/rebuild-archive-index";

export {
  moderateReport,
} from "./admin/moderate-report";


export {
  deleteReport,
} from "./admin/delete-report";

export {
  submitAppeal,
} from "./moderation/submit-appeal";

export {
  renewMarketplaceListing,
} from "./marketplace/renew-marketplace-listing";
